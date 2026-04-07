## Context

项目从零开始搭建前端工程。原型页（`temp/原型/code.html`）已定义完整的视觉语言和交互形态，作为 UI 还原基准。后端 `POST /api/v1/chat` SSE 端点将在 M1 后端任务中并行开发，前端需预留 mock 联调能力。

## Goals / Non-Goals

**Goals:**
- 搭建可运行的 React + Vite + TypeScript 工程，集成 Tailwind CSS 设计 token
- 还原原型页布局和交互（欢迎态 / 对话态切换、双侧边栏、顶导）
- 实现 SSE 客户端，接通后端流式接口
- 实现流式文本气泡渲染
- 用 Zustand 管理对话状态

**Non-Goals:**
- A2UI 渲染（M2）
- 插件系统（M3）
- 双向 action 回传（M4）
- RAG 检索（M5）
- 用户认证、持久化存储

## Decisions

### D1: Vite + React + TypeScript

选择 Vite 作为构建工具，原因：
- 开发服务器启动极快，HMR 无感刷新
- 官方支持 React + TS 模板，配置成本低
- 与后续 `@a2ui/react` 本地包安装方式兼容

备选方案：Next.js —— 排除，M1 不需要 SSR/SSG，额外复杂度无收益。

### D2: Tailwind CSS + 自定义 token

原型页已基于 Tailwind 编写完整设计 token（色彩、字体、阴影）。直接将 `tailwind.config` 中的 `theme.extend` 迁移至工程配置，保持与原型页 100% 一致，无需维护两套变量。

### D3: Zustand 做状态管理

选择 Zustand，原因：
- API 极简，无模板代码
- 与 React 18 并发特性兼容
- 后续 M2 扩展流式 A2UI 状态时改动范围局限在 `chatStore.ts`

备选方案：React Context —— 排除，频繁的流式更新会导致全树重渲染。

### D4: SSE 客户端自封装（不用 EventSource 原生 API）

原生 `EventSource` 不支持 POST 请求，需用 `fetch` + `ReadableStream` 手动解析。封装在 `api/chat.ts` 单文件中，暴露 `streamChat(messages, onChunk, onDone, onError)` 接口，后续替换传输层不影响上层。

### D5: 欢迎态 / 对话态视图切换

两种状态共用同一个 `App` 根组件，通过 `chatStore` 中的 `isActive` 字段驱动 CSS transition 切换，与原型页 `chat-active` class 方案一致，避免路由跳转带来的布局闪烁。

## Risks / Trade-offs

- **后端未就绪时无法真实联调** → 在 `api/chat.ts` 中增加 `VITE_USE_MOCK` 环境变量开关，mock 时本地模拟 SSE 逐字流
- **`@a2ui/react` 本地路径依赖可能引发 node_modules 解析问题** → M1 仅安装不使用，若安装失败则跳过，M2 再处理
- **Tailwind CDN vs PostCSS 构建**：原型页用 CDN，工程需切换为 PostCSS 插件；token 迁移需手动验证颜色值一致性
