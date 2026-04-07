## 1. 环境准备

- [x] 1.1 确认 `@a2ui/react` 本地依赖已安装：运行 `npm ls @a2ui/react`，若未安装则执行 `npm install ../../vendor/A2UI-main/renderers/react`
- [x] 1.2 确认 `frontend/package.json` 中本地路径依赖配置正确（`"@a2ui/react": "file:../../vendor/A2UI-main/renderers/react"`）
- [x] 1.3 确认 `vite.config.ts` 对本地包无别名冲突，`npm run dev` 可正常启动

## 2. StreamSplitter 实现

- [x] 2.1 新建 `src/a2ui-engine/StreamSplitter.ts`，定义 `SplitResult` discriminated union 类型（`text` / `a2ui` / `done` / `unknown`）
- [x] 2.2 实现 `splitSSELine(raw: string): SplitResult` 纯函数：去除 `data: ` 前缀，JSON.parse，按 `type` 字段分支返回，解析失败返回 `{ type: 'unknown' }`
- [ ] 2.3 手动验证：在 `vite` 控制台或测试文件中对 text / a2ui / done / 非法 JSON 四种输入调用函数，确认返回值正确

## 3. CatalogRegistry 实现

- [x] 3.1 新建 `src/a2ui-engine/CatalogRegistry.ts`，从 `@a2ui/react` 导入 `registerDefaultCatalog`、`initializeDefaultCatalog`
- [x] 3.2 实现 `setupDefaultCatalog()` 函数：依次调用 `registerDefaultCatalog()` 和 `initializeDefaultCatalog()`
- [x] 3.3 添加空函数 `registerPluginComponents(components: PluginComponent[])` 作为 M3 扩展点，加注释说明用途

## 4. A2UISetup 实现

- [x] 4.1 新建 `src/a2ui-engine/A2UISetup.tsx`，从 `@a2ui/react` 导入 `A2UIProvider`
- [x] 4.2 实现 `A2UISetup` 包装组件：用 `A2UIProvider` 包裹 `children`，在 `useEffect`（空依赖数组）中调用 `setupDefaultCatalog()` 完成一次性初始化
- [x] 4.3 更新 `src/App.tsx`：用 `<A2UISetup>` 包裹原有根内容，替换原有最外层包装

## 5. A2UISurface 实现

- [x] 5.1 新建 `src/components/Chat/A2UISurface.tsx`，从 `@a2ui/react` 导入 `A2UIRenderer`
- [x] 5.2 实现 `A2UISurface` 组件：渲染 `<A2UIRenderer surfaceId="main" />`，左对齐，最大宽度 80%，加 M3 surfaceId 评估注释
- [x] 5.3 添加容器样式：左对齐布局、最小高度防坍塌，与 `TextBubble` AI 侧对齐保持视觉一致

## 6. chatStore 消息模型扩展

- [x] 6.1 在 `src/store/chatStore.ts` 中扩展消息类型为 `TextMessage | A2UIMessage` 联合类型，`A2UIMessage` 仅含 `role: 'assistant'` 和 `type: 'a2ui'` 字段，不持有内容
- [x] 6.2 更新 store actions：新增 `addA2UIMessage()` action，在收到第一条 a2ui 行时向消息列表插入 `A2UIMessage` 占位（同一轮响应只插入一次）

## 7. useChat 接入 StreamSplitter

- [x] 7.1 在 `src/hooks/useChat.ts` 中导入 `splitSSELine`，将 SSE chunk 解析逻辑替换为调用 `splitSSELine`
- [x] 7.2 根据返回类型分流：`text` → 追加文本（原逻辑）；`a2ui` → 调用 `useA2UI().processMessages([line])`，同时触发 `addA2UIMessage()`；`done` → 结束流（原逻辑）
- [x] 7.3 从 `@a2ui/react` 导入 `useA2UI` hook，确认在 `A2UISetup`（即 `A2UIProvider`）下调用不报错

## 8. MessageStream 混合渲染

- [x] 8.1 在 `src/components/Chat/MessageList.tsx` 中导入 `A2UISurface`
- [x] 8.2 更新消息列表渲染逻辑：根据消息 `type` 字段分支渲染——`text` 消息渲染 `TextBubble`，`a2ui` 消息渲染 `A2UISurface`

## 9. Mock 模式更新

- [x] 9.1 在 `src/api/chat.ts` 的 mock 分支中，在文本 chunk 序列后追加至少一条模拟 `a2ui` 行（含合法 A2UI JSONL 内容），触发 `onA2UILine` 回调
- [x] 9.2 确认 mock 模式下 `streamChat` 函数签名新增 `onA2UILine: (line: string) => void` 参数，与真实模式保持一致

## 10. 端到端验证

- [ ] 10.1 启动 `VITE_USE_MOCK=true npm run dev`，发送消息，确认文本逐字流式出现
- [ ] 10.2 确认 mock 流结束后 `A2UISurface` 出现在消息列表中，A2UI 组件正常渲染（无控制台报错）
- [ ] 10.3 确认文本气泡与 A2UI Surface 在消息列表中顺序正确、布局对齐符合设计规范
- [ ] 10.4 确认回滚可行：从 `App.tsx` 移除 `<A2UISetup>` 后应用可退回 M1 纯文本模式
