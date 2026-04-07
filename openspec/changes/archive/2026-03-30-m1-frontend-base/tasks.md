## 1. 工程初始化

- [x] 1.1 用 `npm create vite@latest frontend -- --template react-ts` 初始化前端项目
- [x] 1.2 安装 Tailwind CSS 及 PostCSS 插件（`tailwindcss`, `postcss`, `autoprefixer`），初始化配置文件
- [x] 1.3 将原型页 `tailwind.config` 的 `theme.extend`（色彩 token、字体、阴影）迁移至 `frontend/tailwind.config.ts`
- [x] 1.4 在 `index.css` 引入 Google Fonts（Newsreader、Manrope、Noto Serif SC）和 Material Symbols
- [x] 1.5 安装 `zustand` 依赖
- [x] 1.6 尝试本地安装 `@a2ui/react`（绝对路径安装成功）
- [x] 1.7 配置 `vite.config.ts`：设置开发服务器端口、代理 `/api` 至后端（`http://localhost:8000`）
- [x] 1.8 添加 `.env.development` 文件，定义 `VITE_USE_MOCK=true` 和 `VITE_API_BASE=/api`

## 2. 状态管理（chat-state）

- [x] 2.1 创建 `src/store/chatStore.ts`，定义 `Message` 类型（`id`, `role`, `content`, `isStreaming`）
- [x] 2.2 实现 `isActive`, `messages`, `isLoading`, `error` 状态字段
- [x] 2.3 实现 `sendMessage` action：追加用户消息、追加 AI 占位消息、设置 `isLoading: true`、`isActive: true`
- [x] 2.4 实现 `appendChunk(id, chunk)` action：追加内容到指定消息
- [x] 2.5 实现 `finishMessage(id)` action：置 `isStreaming: false`、`isLoading: false`
- [x] 2.6 实现 `setError(msg)` action：置 `error`、`isLoading: false`

## 3. SSE 客户端（sse-client）

- [x] 3.1 创建 `src/api/chat.ts`，定义 `Message` 请求类型和 `streamChat` 函数签名
- [x] 3.2 实现 Mock 模式（`VITE_USE_MOCK=true`）：本地逐字延迟输出模拟流
- [x] 3.3 实现真实 SSE 模式：`fetch` + `ReadableStream` 读取流，逐行解析 `data: <JSON>`
- [x] 3.4 处理 `type: text` → 调用 `onChunk`；`type: done` → 调用 `onDone` 并关闭流
- [x] 3.5 捕获网络错误和 JSON 解析异常，调用 `onError`

## 4. 基础布局（app-layout）

- [x] 4.1 创建 `src/components/Layout/AppShell.tsx`：整体三列布局容器（左边栏 + 主区 + 右边栏）
- [x] 4.2 创建 `src/components/Layout/TopNav.tsx`：顶部导航栏，含左右侧边栏切换按钮和 Logo
- [x] 4.3 创建 `src/components/Layout/LeftSidebar.tsx`：可折叠左侧边栏，CSS transition 动画
- [x] 4.4 创建 `src/components/Layout/RightSidebar.tsx`：可折叠右侧边栏，CSS transition 动画
- [x] 4.5 在 `App.tsx` 组合 TopNav + AppShell，验证折叠交互正常、无边框分隔线

## 5. 对话界面（chat-interface）

- [x] 5.1 创建 `src/components/Chat/TextBubble.tsx`：接收 `content` 和 `isStreaming` props，流式进行中显示光标动画
- [x] 5.2 创建 `src/components/Chat/MessageList.tsx`：渲染消息列表，用户消息右对齐，AI 消息左对齐，新消息自动滚动到底
- [x] 5.3 创建 `src/components/Chat/WelcomeView.tsx`：欢迎态居中布局（大标题 + 副标题 + 输入框），按原型页还原
- [x] 5.4 创建 `src/components/Chat/ChatInput.tsx`：多行文本输入框 + 发送按钮，Enter 发送、Shift+Enter 换行、空输入禁用按钮
- [x] 5.5 创建 `src/components/Chat/ChatView.tsx`：对话态容器，组合 MessageList + 底部固定 ChatInput
- [x] 5.6 在主内容区根据 `chatStore.isActive` 切换渲染 WelcomeView / ChatView，CSS transition 过渡

## 6. 串联与联调

- [x] 6.1 在 `ChatInput`（欢迎态和对话态）的发送事件中调用 `chatStore.sendMessage`，触发 `streamChat`
- [x] 6.2 在 `streamChat` 回调中调用 `appendChunk` / `finishMessage` / `setError`，验证流式渲染正常
- [x] 6.3 以 Mock 模式（`VITE_USE_MOCK=true`）完整走通：欢迎态发送 → 对话态 → AI 逐字流式响应
- [ ] 6.4 关闭 Mock 模式，对接后端真实 SSE 端点，验证全链路流式对话
