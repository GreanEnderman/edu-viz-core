## Why

AhaTutor v2.0 当前尚无前端工程，需要从零搭建 React 应用作为整个对话系统的交互入口。M1 前端基座是所有后续里程碑（A2UI 渲染、插件系统、双向交互）的先决条件，必须先行完成。

## What Changes

- 新建 `/frontend` React + Vite + TypeScript 工程
- 集成 Tailwind CSS，配置「The Illuminated Mind」设计 token（色彩、字体、阴影体系）
- 实现两栏式应用布局：左侧可折叠资料库侧边栏 + 主内容区 + 右侧可折叠侧边栏 + 顶部导航栏
- 实现欢迎态（居中输入框）→ 对话态（消息流 + 底部输入栏）的视图切换
- 实现 SSE 客户端封装（`api/chat.ts`），支持逐 chunk 回调
- 实现流式文本气泡组件（`TextBubble.tsx`）
- 实现 Zustand 状态管理（`chatStore.ts`）：消息列表、流式缓冲、输入状态
- 消息输入框支持回车发送

## Capabilities

### New Capabilities

- `app-layout`: 应用整体布局 — 顶部导航栏、左侧资料库侧边栏（可折叠）、右侧侧边栏（可折叠）、主内容区，遵循原型页设计规范
- `chat-interface`: 对话界面 — 欢迎态与对话态视图切换、消息列表渲染（TextBubble）、底部输入栏（支持回车/按钮发送）
- `sse-client`: SSE 连接封装 — 连接 `POST /api/v1/chat`，解析 `{type, content}` 数据格式，逐 chunk 触发回调
- `chat-state`: 对话状态管理 — Zustand store，管理消息列表、流式输出缓冲、加载/错误状态

### Modified Capabilities

（无，M1 为全新工程，无存量 spec）

## Impact

- **新增目录**：`/frontend`（Vite + React + TypeScript + Tailwind CSS）
- **外部依赖**：`@a2ui/react`（本地路径安装）、`zustand`、`tailwindcss`
- **接口依赖**：后端 `POST /api/v1/chat` SSE 端点（M1 后端任务并行开发，前端可用 mock 先行联调）
- **设计依赖**：`temp/原型/code.html` 原型页作为 UI 还原基准，`CLAUDE.md` 前端设计规范为样式约束
- **无破坏性变更**（全新模块）
