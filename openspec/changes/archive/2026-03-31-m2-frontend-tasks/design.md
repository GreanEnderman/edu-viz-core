## Context

M1 已建立前端流式对话基座：`api/chat.ts` 通过 Fetch + ReadableStream 消费 SSE，`useChat.ts` 驱动状态，`MessageStream.tsx` 渲染纯文本气泡。当前 SSE 解析只处理 `type: text` 和 `type: done`，无 A2UI 分支。

`@a2ui/react` 已位于 `vendor/A2UI-main/renderers/react`，导出：`A2UIProvider`、`A2UIRenderer`、`useA2UI`、`ComponentRegistry`、`registerDefaultCatalog`、`initializeDefaultCatalog`。

## Goals / Non-Goals

**Goals:**
- SSE 流新增 `type: a2ui` 分支，解析 JSONL 行交由 A2UI 处理
- 在 `App.tsx` 层初始化 `A2UIProvider`，完成样式注入和默认目录注册
- 聊天流支持文本气泡与 A2UI Surface 混合渲染
- 不改动任何后端代码

**Non-Goals:**
- 插件组件注册（M3 任务）
- `onAction` 回调对接（M4 任务）
- 后端 prompt_builder / a2ui_builder（独立变更）

## Decisions

### 1. StreamSplitter 作为纯函数工具模块，而非 React Hook

**决策**：`StreamSplitter.ts` 导出一个解析函数，接收原始 SSE chunk 字符串，返回 `{ type, payload }` 的 discriminated union。
**理由**：SSE 解析不依赖 React 生命周期，纯函数更易测试，也避免与 `useChat` 产生循环 Hook 依赖。`useChat.ts` 直接调用此函数，根据返回类型分别处理。
**备选**：将分流逻辑内联在 `useChat.ts` 中——拒绝，因为会使 Hook 膨胀且无法独立测试。

### 2. A2UIProvider 挂载在 App 根部，surfaceId 固定为 `"main"`

**决策**：`A2UISetup.tsx` 导出一个包装组件，在 `App.tsx` 中替换原有根包装，提供全局 A2UI context。`A2UIRenderer` 使用固定 `surfaceId="main"`。
**理由**：A2UIProvider 是全局单例，M2 阶段只有一个对话 surface，过早引入多 surface 管理是不必要的复杂度。
**备选**：每条 AI 消息各自持有独立 surfaceId——拒绝，M2 阶段 A2UI 消息会追加到同一 surface，与后端 a2ui_builder 的设计一致。

### 3. MessageStream 消息模型扩展为联合类型

**决策**：`chatStore.ts` 中的消息类型扩展为 `TextMessage | A2UIMessage`，`MessageStream.tsx` 根据消息类型渲染 `TextBubble` 或 `A2UISurface`。`A2UIMessage` 不持有内容，仅作为渲染 `<A2UIRenderer>` 的占位标记（内容由 A2UI context 管理）。
**理由**：A2UI state 由 `A2UIProvider` 内部管理，前端消息列表不需要重复存储 A2UI 数据，避免双写问题。
**备选**：在消息对象中缓存 A2UI JSONL——拒绝，会造成 A2UI context 与 store 状态不同步。

### 4. CatalogRegistry 在 A2UISetup 初始化时同步执行

**决策**：`CatalogRegistry.ts` 导出 `registerDefaultCatalog()` 函数，在 `A2UISetup.tsx` 的 `useEffect`（仅执行一次）中调用，调用 `@a2ui/react` 的 `registerDefaultCatalog` + `initializeDefaultCatalog`。
**理由**：M2 阶段只注册标准组件，无异步加载需求；同步注册最简单。M3 插件注册将在此文件中追加，接口已预留。

## Risks / Trade-offs

- **surfaceId 冲突**：固定 `"main"` 意味着多轮对话共享同一 A2UI surface state，后续 AI 消息的 A2UI 更新会覆盖上一条。M2 阶段这是预期行为（与后端设计一致），M3/M4 视需要再拆分 surface。
  → 暂不处理，在 `A2UISurface.tsx` 注释中标注待 M3 评估。

- **`@a2ui/react` 本地路径依赖**：`vendor/A2UI-main/renderers/react` 须提前 `npm install`，CI 环境需特殊处理。
  → 确认 package.json 中已配置本地路径依赖，安装验证列入 tasks。

- **SSE `type: a2ui` 的 JSONL 格式**：M2 阶段后端尚未完成，前端需 mock 数据验证渲染路径。
  → StreamSplitter 的 mock 模式（`VITE_USE_MOCK=true`）中加入 A2UI 示例行，覆盖完整渲染路径。

## Migration Plan

1. 确认 `@a2ui/react` 依赖已安装（`npm ls @a2ui/react`）
2. 新增 `src/a2ui-engine/` 三个文件（不改动现有代码）
3. 更新 `App.tsx`：用 `A2UISetup` 包裹根组件
4. 扩展 `chatStore.ts` 消息联合类型
5. 更新 `useChat.ts` 接入 StreamSplitter
6. 更新 `MessageStream.tsx` 支持混合渲染
7. 用 mock 模式端到端验证：文本流 + A2UI 组件同时出现

回滚：步骤 3–6 均为增量修改，`A2UISetup` 可直接从 `App.tsx` 移除回滚到 M1 状态。

## Open Questions

- 后端 `a2ui` SSE 消息中 `line` 字段的具体 JSONL schema（v0.8）是否已确认？StreamSplitter 需要知道字段名才能正确透传给 `processMessages`。（预计后端 M2 变更明确后可关闭）
