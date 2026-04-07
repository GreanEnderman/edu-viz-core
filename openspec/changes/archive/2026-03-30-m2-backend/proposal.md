## Why

M1 已建立纯文本 SSE 对话基座，M2 需要在后端为 LLM 注入 A2UI 输出格式指令，并将 LLM 产出的 A2UI JSONL 消息包装成 SSE 可传输格式，使前端具备渲染交互式学科组件的能力。本阶段结束后冻结 SSE 数据格式（`type` 字段）和 A2UI 消息结构（v0.8 JSONL）。

## What Changes

- 新增 `orchestrator/prompt_builder.py`：向 System Prompt 注入 A2UI v0.8 输出格式指令及可用组件列表
- 新增 `orchestrator/a2ui_builder.py`：将 A2UI JSONL 行包装为 SSE `{"type":"a2ui","line":"..."}` 格式
- 更新 `POST /api/v1/chat`：接入 prompt_builder 后调用 LLM，混合输出 `text` 行和 `a2ui` 行
- 新增 `models/a2ui_schema.py`：A2UI v0.8 消息的 Pydantic 模型（surfaceUpdate / dataModelUpdate / beginRendering）

## Capabilities

### New Capabilities
- `prompt-builder`: 组装包含 A2UI 格式指令和可用组件列表的 System Prompt
- `a2ui-builder`: 将 A2UI JSONL 对象序列化并包装为 SSE `a2ui` 类型消息
- `a2ui-schema`: A2UI v0.8 消息结构的 Pydantic 数据模型

### Modified Capabilities
- `chat-sse-stream`: SSE 流除原有 `text` / `done` 类型外，新增 `a2ui` 类型消息；chat endpoint 调用链从直接调 LLM 变为经 prompt_builder 后再调 LLM

## Impact

- **后端文件**：`app/api/v1/chat.py`（更新）、新增 `app/orchestrator/prompt_builder.py`、`app/orchestrator/a2ui_builder.py`、`app/models/a2ui_schema.py`
- **SSE 协议**：在 M1 已有 `text` / `done` 基础上新增 `a2ui` 类型，本阶段结束后冻结
- **无前端改动**：M2 前端任务在独立变更中处理
- **无外部新依赖**：A2UI JSONL 构建为纯字符串拼接，不引入新库
