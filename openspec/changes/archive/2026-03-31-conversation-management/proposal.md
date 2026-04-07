## Why

当前系统仅支持单次连续对话，消息存储在内存中，刷新页面即丢失。用户无法回顾历史对话、无法在不同话题间切换，也无法创建新的独立对话。实现对话管理是产品可用的基础前提。

## What Changes

- 新增对话生命周期管理：创建新对话、切换对话、删除对话
- 后端新增对话持久化存储（SQLite），提供对话 CRUD API
- 前端 chatStore 重构为多对话模型，支持对话列表与切换
- 在现有 LeftSidebar 上连接真实功能：将「开启新思」按钮绑定新建对话、nav 区域渲染对话列表、支持切换与删除
- 聊天 API 增加对话 ID 参数，消息绑定到具体对话

## Capabilities

### New Capabilities

- `conversation-api`: 后端对话管理 REST API，包括对话的创建、查询、删除，以及消息按对话存储与检索
- `conversation-state`: 前端多对话状态管理，包括对话列表维护、当前对话切换、消息按对话组织
- `conversation-ui`: 在现有 LeftSidebar 组件上连接真实功能——「开启新思」按钮绑定新建对话、nav 区域渲染对话历史列表、支持切换与删除（不新建组件，复用已有骨架）

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **后端 API**: 新增 `/api/v1/conversations` 系列端点；现有 `POST /api/v1/chat` 需接受 `conversation_id` 参数
- **前端 Store**: `chatStore.ts` 需从单对话模型重构为多对话模型
- **前端 Hooks**: `useChat.ts` 需适配对话上下文
- **前端 API**: `chat.ts` 需新增对话相关请求函数
- **前端布局**: 改造现有 LeftSidebar 组件，不新增布局组件
- **数据库**: 新增 SQLite 表（conversations、messages）
- **依赖**: 无新增外部依赖，SQLite 已包含在 Python 标准库中
