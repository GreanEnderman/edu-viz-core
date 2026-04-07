# AhaTutor v2.0 开发落地计划

> 版本：v0.2
> 日期：2026-03-29
> 状态：规划阶段（已整合 @a2ui/react 库）

---

## 核心原则

1. **每个里程碑结束时系统都可独立运行和演示**
2. **契约先行**：SSE 数据格式、A2UI 消息结构、manifest 格式在对应里程碑结束时冻结
3. **替换而非修改**：意图路由、检索策略、LLM 供应商等易变部分局限在单文件内
4. **渐进增强**：每个里程碑是对上一个的增量，而非重写

---

## 模块依赖关系

```
M1（流式对话基座）
  └─ M2（A2UI 协议层）          ← 冻结 SSE 数据格式 + A2UI 消息结构
       └─ M3（首个插件）         ← 冻结 manifest 格式 + ComponentRegistry 接口
            └─ M4（双向交互）    ← A2UI onAction 机制已内置，主要是后端对接
M1 ──────────────────────────── M5（RAG 知识检索）   ← 可在 M2 后并行开发
```

---

## 前置准备：依赖安装

- [ ] 在 `frontend/` 中以本地路径安装 `@a2ui/react`：
  ```bash
  npm install ../../vendor/A2UI-main/renderers/react
  ```
- [ ] 确认 `@a2ui/web_core` 依赖可用（`@a2ui/react` 的内部依赖）


---

## 里程碑详细计划

### M1 — 流式对话基座

**目标**：跑通「前端 → 后端 → LLM → SSE 流回前端」全链路，纯文本对话，不含 A2UI 或 RAG。

**完成标志**：能流式对话，文字逐字出现。

#### 后端任务

- [ ] 初始化 FastAPI 项目（`/backend`），配置 `core/config.py`（LLM API Key、端口、CORS）
- [ ] 实现 `POST /api/v1/chat`：接收消息列表，调用 LLM，SSE 流式返回
- [ ] 约定 SSE 数据格式：`data: {"type": "text", "content": "..."}` 和 `data: {"type": "done"}`
- [ ] 配置 CORS，允许前端开发服务器跨域

#### 前端任务

- [ ] 初始化 React + Vite + TypeScript 项目（`/frontend`）
- [ ] 安装本地 `@a2ui/react`（`vendor/A2UI-main/renderers/react`）
- [ ] 集成 Tailwind CSS，确定设计 token
- [ ] 实现基础 Layout（侧边栏 + 主内容区）
- [ ] 实现 `api/chat.ts`：封装 SSE 连接，逐 chunk 回调
- [ ] 实现 `TextBubble.tsx`：流式文本渲染
- [ ] 实现 `chatStore.ts`（Zustand）：消息列表、输入状态
- [ ] 实现消息输入框，支持回车发送

#### 本阶段可调整点

- LLM 供应商和模型（改 `core/config.py` 即可）
- SSE 数据格式（本阶段改动成本最低，M2 后冻结）
- 前端 UI 风格

---

### M2 — A2UI 协议层

**目标**：集成 `@a2ui/react`，后端在流中嵌入 A2UI JSONL 消息，前端能解析并渲染（暂用标准组件，不需真实学科插件）。

**完成标志**：LLM 输出 A2UI 消息时，前端渲染出标准组件（如 Slider、Button），文字正常流式渲染。

**⚠️ 本阶段结束冻结：SSE 数据格式（`type` 字段）+ A2UI 消息结构（v0.8 JSONL）**

#### 后端任务

- [ ] 实现 `orchestrator/prompt_builder.py`：向 System Prompt 注入 A2UI v0.8 输出格式指令和可用组件列表
- [ ] 实现 `orchestrator/a2ui_builder.py`：将 A2UI JSONL 消息包装为 SSE `{"type":"a2ui","line":"..."}` 格式
- [ ] 更新 `POST /api/v1/chat`：经 prompt_builder 后调用 LLM，混合输出文本行和 A2UI 行

#### 前端任务

- [ ] 实现 `a2ui-engine/StreamSplitter.ts`：根据 SSE `type` 字段分流（text → TextBubble，a2ui → processMessages）
- [ ] 实现 `a2ui-engine/A2UISetup.tsx`：配置 `A2UIProvider`，调用 `injectStyles()` 和 `initializeCatalog()`
- [ ] 实现 `a2ui-engine/CatalogRegistry.ts`：调用 `registerDefaultCatalog`（暂只注册标准组件）
- [ ] 实现 `components/Chat/A2UISurface.tsx`：包装 `<A2UIRenderer surfaceId="main" />`
- [ ] 更新 `MessageStream.tsx`：混合渲染 TextBubble + A2UISurface
- [ ] 更新 `useChat.ts`：接入 StreamSplitter，对接 `useA2UI().processMessages`

#### 本阶段可调整点

- A2UISurface 的容器样式
- StreamSplitter 的分流逻辑细节


---

### M3 — 插件系统 + 首个插件

**目标**：构建完整的插件基础设施（动态加载、按用户启用/禁用、Prompt 集成），并实现第一个学科插件（物理简谐运动）作为端到端验证。

**完成标志**：提问「展示振幅为 5 的简谐运动」，物理动画在聊天框内真实运行；用户可在设置中启用/禁用插件。

**⚠️ 本阶段结束冻结：manifest.json 格式 + 动态加载机制 + 插件 API**

#### 插件模型

插件由我们提供，随应用一起发布。用户可按需启用/禁用，系统仅加载已启用插件。插件组件通过 ESM 动态 import() 加载，不打包进主 bundle。

```
/plugins/
├── physics-high-school/
│   ├── manifest.json
│   ├── dist/index.esm.js       ← 构建产物，动态加载
│   └── knowledge/vector.db     ← 预构建的知识库
└── ...
```

manifest.json 新增 `entry.js` 字段（指向构建产物），插件开发者需自行构建并提交。

#### 后端任务

- [ ] 插件数据模型（`backend/app/models/plugin.py`）：Pydantic 定义 PluginManifest、Capability、PropsSchema
- [ ] 插件加载器（`backend/app/plugins_manager/loader.py`）：启动时扫描 `/plugins`，读取并校验所有 manifest.json
- [ ] 插件注册表（`backend/app/plugins_manager/registry.py`）：内存注册表（`component_id → 插件信息`），提供 `get_enabled_capabilities(user_id)` 和 `get_all_plugins()`
- [ ] 插件用户状态管理：`plugin_user_settings` 表（user_id, plugin_id, enabled），按用户控制启用/禁用
- [ ] 插件 API（`backend/app/routers/plugins.py`）：
  - `GET /api/v1/plugins` → 返回插件列表 + 当前用户启用状态
  - `POST /api/v1/plugins/{id}/toggle` → 切换当前用户的启用/禁用
- [ ] 后端静态文件服务：挂载 `/plugins/` 为静态目录，支持前端 dynamic import()
- [ ] prompt_builder 集成：从 registry 读取当前用户已启用插件的 capabilities（含 props_schema、a2ui_hint），注入 system prompt
- [ ] 更新 `main.py` lifespan：启动时执行插件加载

#### 前端任务

- [ ] CatalogRegistry 重构（`frontend/src/a2ui-engine/CatalogRegistry.ts`）：
  - 启动时 `GET /api/v1/plugins` 获取已启用插件列表
  - 对每个已启用插件 dynamic import() 其 `dist/index.esm.js`
  - 注册到 A2UI ComponentRegistry
- [ ] 插件管理 UI：设置页面，显示可用插件列表 + 启用/禁用开关，风格与主页面一致（The Illuminated Mind）
- [ ] Gallery 验证：在 Gallery 中添加 PhysicsOscillator 示例，验证渲染效果

#### 插件任务（physics-high-school）

- [ ] 初始化插件目录结构（`/plugins/physics-high-school/`）
- [ ] 实现 `PhysicsOscillator` React 组件（Canvas 动画，接收 amplitude、freq、phase props）
- [ ] 配置插件构建（vite.config：React external，输出 ESM）
- [ ] 编写 `manifest.json`：含 entry.js、entry.vector_db、keywords、capabilities（component_id、props_schema、a2ui_hint、expresses、educational_use、cannot_express）
- [ ] 准备知识库：学科文档 + 构建工具生成 vector.db

#### 开发者工具

- [ ] 插件脚手架模板（目录结构 + vite 配置，可复制创建新插件）
- [ ] manifest AI Prompt 模板：辅助插件开发者用 AI 生成完整的 manifest.json
- [ ] 知识库构建 CLI 工具：`aha-plugin build-knowledge --input ./docs --output ./knowledge/vector.db`

#### 本阶段可调整点

- 插件组件内部动画实现（Canvas / CSS / WebGL）
- `props_schema` 的字段扩展
- 动态加载的具体实现细节（ESM import vs 其他方案）

---

### M4 — 双向交互

**目标**：用户操作 A2UI 标准组件（Slider），AI 感知参数变化并响应。

**完成标志**：拖动 Slider 改振幅后，AI 回复「你将振幅调整为 3，此时周期为…」。

> `@a2ui/react` 已内置 `onAction` 机制，本阶段主要工作在于后端对接和交互策略确定。

#### 前端任务

- [ ] 实现 `hooks/useA2UIActions.ts`：接收 `A2UIClientEventMessage`，格式化为对话上下文
- [ ] 更新 `chatStore.ts`：新增 `appendInteractionContext()` 和 `triggerFollowUp()`
- [ ] 确定交互触发策略（实时 / 防抖 300ms / 用户手动确认），在 `useA2UIActions` 中实现
- [ ] 将 `handleAction` 传入 `A2UIProvider` 的 `onAction` prop

#### 后端任务

- [ ] 更新 `POST /api/v1/chat` 请求体：支持 `interaction_context` 字段（含 action name + context）
- [ ] 更新 `prompt_builder.py`：将交互上下文注入 Prompt，告知 LLM 用户的操作

#### 本阶段可调整点

- 交互触发策略（防抖时间、是否需要用户确认）
- 交互上下文在对话历史中的呈现形式

---

### M5 — RAG 知识检索

**目标**：接入向量库，回答有知识依据，意图路由决定检索哪个插件的知识库。

**前置条件**：M1（后端基座）、M2（prompt_builder 存在）；可与 M3/M4 并行。

**完成标志**：回答质量明显提升，能引用学科知识库中的具体内容。

#### 知识库准备

- [ ] 收集本体基础知识文档，构建基础向量库（`/data/vector.db`）
- [ ] 收集物理学科文档，构建插件向量库（`/plugins/physics-high-school/knowledge/vector.db`）
- [ ] 确定分块策略（chunk size、overlap）和嵌入模型

#### 后端任务

- [ ] 实现 `orchestrator/intent_router.py`：关键词匹配插件 `keywords`，返回命中插件 ID 列表
- [ ] 实现 `orchestrator/retriever.py`：并行检索本体库 + 命中学科插件库，返回 top-k 片段
- [ ] 更新 `orchestrator/prompt_builder.py`：将检索结果注入 Prompt
- [ ] 更新 `POST /api/v1/chat`，串联 `intent_router → retriever → prompt_builder`

#### 本阶段可调整点（全部局限在 `orchestrator/` 内）

- 检索策略：BM25 / 向量 / 混合
- 向量库实现：ChromaDB / FAISS / Qdrant
- 意图路由：关键词匹配 → 嵌入模型（仅替换 `intent_router.py`）
- 文档分块参数

---

## 契约冻结时间表

| 契约 | 冻结于 | 影响范围 |
|------|--------|----------|
| SSE 数据格式（`type` 字段） | M2 结束 | 前后端通信、StreamSplitter |
| A2UI 消息结构（v0.8 JSONL） | M2 结束 | 后端 a2ui_builder、前端 processMessages |
| manifest.json 格式 | M3 结束 | 所有后续插件开发、后端 PluginsManager |
| 动态加载机制 | M3 结束 | 前端 CatalogRegistry、后端静态文件服务 |
| 插件 API | M3 结束 | 前端插件管理 UI、后端插件路由 |

---

## 各模块可替换边界

| 模块 | 可替换内容 | 替换范围 |
|------|-----------|----------|
| LLM 接入 | 供应商、模型版本 | `core/config.py` + `chat.py` 调用处 |
| 意图路由 | 关键词匹配 → 嵌入模型 | 仅 `intent_router.py` |
| 向量检索 | ChromaDB / FAISS / Qdrant | 仅 `retriever.py` |
| A2UI 版本 | v0.8 → v0.9（待 React renderer 支持） | `a2ui_builder.py` + `a2ui_schema.py` |
| 交互触发策略 | 实时 / 防抖 / 手动确认 | 仅 `useA2UIActions.ts` |
| 插件新增 | 新增学科插件 | `/plugins/新插件/` + 构建产物放入 dist/ |


