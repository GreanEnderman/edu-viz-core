## Context

M1 已完成后端基座：FastAPI 应用、`POST /api/v1/chat` 接收消息列表、LLM 直接调用、SSE 流式输出 `text` / `done` / `error` 三种类型。当前 chat endpoint 直接将消息传给 LLM，无任何 System Prompt 注入逻辑。

M2 后端目标：在 LLM 调用前注入 A2UI v0.8 格式指令（prompt_builder），并在 SSE 流中混合输出 A2UI JSONL 行（a2ui_builder），同时定义 A2UI 消息的 Pydantic 数据模型。

约束：
- A2UI 规范版本锁定为 v0.8（`@a2ui/react` 当前支持版本）
- 不引入新的外部依赖
- 本阶段结束后冻结 SSE `type` 字段枚举和 A2UI JSONL 消息结构

## Goals / Non-Goals

**Goals:**
- 实现 `prompt_builder.py`：构建含 A2UI 格式指令的 System Prompt
- 实现 `a2ui_builder.py`：将 A2UI JSONL 对象序列化为 SSE `a2ui` 行
- 实现 `a2ui_schema.py`：A2UI v0.8 核心消息的 Pydantic 模型
- 更新 `chat.py`：调用链接入 prompt_builder，混合输出 text + a2ui SSE 事件
- 冻结 SSE 数据格式协议（`type` 字段枚举）

**Non-Goals:**
- 意图路由（M5）
- RAG 检索（M5）
- 插件 manifest 加载（M3）
- 前端 StreamSplitter / A2UISetup（M2 前端变更）
- A2UI v0.9 兼容（待 React renderer 支持后再升级）

## Decisions

### 1. prompt_builder 接口设计

**决策**：`PromptBuilder` 为无状态函数模块，暴露 `build_system_prompt(available_components: list[dict]) -> str`。

**理由**：
- M2 阶段可用组件列表为静态硬编码（无真实插件），后续 M3 引入 PluginsManager 后只需修改调用方传入参数，prompt_builder 本身无需改动。
- 无状态函数比类更易测试和替换。

**A2UI 格式指令内容**（注入 System Prompt）：
```
你可以在回答中嵌入 A2UI v0.8 JSONL 消息来渲染交互式组件。
每条 A2UI 消息占独立一行，格式为合法 JSON。
消息序列：surfaceUpdate → dataModelUpdate → beginRendering。
可用组件：{component_list}
普通文本直接输出，不需要任何特殊格式。
```

### 2. a2ui_builder 职责边界

**决策**：`a2ui_builder.py` 仅负责两件事：
1. 提供 A2UI v0.8 消息工厂函数（`surface_update()`, `data_model_update()`, `begin_rendering()`）
2. 提供 `to_sse_event(msg: A2UIMessage) -> str`：序列化为 `data: {"type":"a2ui","line":"<json_escaped>"}

`

**理由**：LLM 本身会在输出流中嵌入 A2UI JSONL 行，后端需要识别这些行并重新包装。将包装逻辑与消息构造分离，使 chat endpoint 的流处理逻辑清晰。

**替代方案排除**：考虑过让 LLM 直接输出 SSE 格式字符串，但 LLM 对 `\n` 转义不稳定，由后端统一包装更可靠。

### 3. LLM 输出流中 A2UI 行的识别策略

**决策**：按行扫描 LLM 输出，尝试 JSON parse；成功且包含 A2UI 标志字段（`type` 为 `surfaceUpdate` / `dataModelUpdate` / `beginRendering`）则视为 A2UI 行，否则视为文本行。

**理由**：A2UI JSONL 本身是合法 JSON 对象，字段 `type` 唯一标识消息类型，无需依赖特殊分隔符。

**风险**：LLM 可能输出包含 JSON 的普通文本（如代码示例）被误判为 A2UI 行。缓解方式：prompt 中明确指示 A2UI 消息必须独占一行且不在代码块中，后续可加 `"__a2ui": true` 哨兵字段。

### 4. a2ui_schema.py 模型粒度

**决策**：M2 阶段仅建模三条核心消息（`SurfaceUpdateMessage`, `DataModelUpdateMessage`, `BeginRenderingMessage`），使用 `Union` 类型别名 `A2UIMessage`。

**理由**：v0.8 规范核心消息集合有限，Pydantic 模型提供序列化验证，避免手工拼接 JSON 出错。仅建模实际用到的消息，避免过度设计。

### 5. chat.py 调用链更新方式

**决策**：在 `POST /api/v1/chat` handler 中，调用顺序更新为：
```
messages → prompt_builder.build_system_prompt() → 插入 system message → LLM stream → 逐行分类 → SSE 输出
```
保持 handler 为单一函数，不抽象为 pipeline 类。

**理由**：当前调用链简单（2步），过早抽象 pipeline 引入不必要复杂度。M5 引入 intent_router + retriever 后再考虑重构。

## Risks / Trade-offs

- **LLM 输出 A2UI 格式不稳定** → Mitigation：prompt 中给出明确示例；M2 阶段前端可容错（未知 type 忽略），不会崩溃
- **行分类误判（普通 JSON 文本被识为 A2UI）** → Mitigation：A2UI 消息 `type` 字段值为特定枚举，普通 JSON 触发概率低；后续可引入哨兵字段
- **SSE 格式冻结后难以修改** → Mitigation：M2 结束前充分验证 `type` 字段枚举，冻结后前后端同步更新成本高
- **无状态 prompt_builder 在 M3 后需传入组件列表** → 调用方变更，prompt_builder 签名不变，影响可控

## Migration Plan

1. 新增 `backend/app/models/a2ui_schema.py`（无副作用，不影响现有路由）
2. 新增 `backend/app/orchestrator/prompt_builder.py`
3. 新增 `backend/app/orchestrator/a2ui_builder.py`
4. 更新 `backend/app/api/v1/chat.py`：接入 prompt_builder，添加 A2UI 行识别和包装逻辑
5. 冻结 SSE 协议：在 `chat-sse-stream` spec 的 delta spec 中新增 `a2ui` 类型的 Requirement

回滚：恢复 `chat.py` 至 M1 版本即可，新增文件无副作用。

## Open Questions

- M2 阶段 `available_components` 硬编码为空列表还是示例标准组件列表？（建议：硬编码含 `Button`、`Slider` 的示例列表，便于端到端验证）
- LLM 输出的 A2UI 行是否需要 schema 校验后再转发，还是直接透传？（建议：M2 阶段直接透传，M3 后引入校验）
