## Why

M1 已完成流式纯文本对话基座。M2 前端任务的目标是在前端接入 `@a2ui/react`，使聊天流能解析后端混入的 A2UI JSONL 消息并渲染为交互组件，为后续插件（M3）打好渲染基础。

## What Changes

- 新增 `a2ui-engine/` 集成层：StreamSplitter、A2UISetup、CatalogRegistry
- 新增 `components/Chat/A2UISurface.tsx`：包装 `<A2UIRenderer>`
- 更新 `components/Chat/MessageStream.tsx`：支持文本气泡与 A2UI Surface 混合渲染
- 更新 `hooks/useChat.ts`：通过 StreamSplitter 分流，将 a2ui 行交由 `processMessages` 处理

## Capabilities

### New Capabilities
- `stream-splitter`: 解析 SSE 事件的 `type` 字段，将 `text` 行分发给文本渲染路径，将 `a2ui` 行分发给 A2UI 处理路径
- `a2ui-engine`: A2UIProvider 初始化配置（injectStyles、initializeCatalog）及默认组件目录注册（registerDefaultCatalog）
- `a2ui-surface`: 聊天流中渲染 A2UI 组件的容器，包装 `<A2UIRenderer surfaceId="main" />`

### Modified Capabilities
- `chat-interface`: MessageStream.tsx 需支持混合渲染（TextBubble + A2UISurface），当前仅渲染纯文本气泡
- `sse-client`: useChat.ts 需接入 StreamSplitter，将原来直接追加文本的逻辑拆分为按类型分流

## Impact

- **前端依赖**：需确认 `@a2ui/react`（本地路径 `vendor/A2UI-main/renderers/react`）已安装
- **影响文件**：`src/a2ui-engine/`（新建）、`src/components/Chat/A2UISurface.tsx`（新建）、`src/components/Chat/MessageStream.tsx`（修改）、`src/hooks/useChat.ts`（修改）
- **无后端改动**：本变更纯前端；后端 M2 任务（prompt_builder、a2ui_builder）为独立变更
- **契约**：本阶段结束后冻结 SSE `type` 字段约定（`text` / `a2ui` / `done`）和 A2UI v0.8 JSONL 消息结构
