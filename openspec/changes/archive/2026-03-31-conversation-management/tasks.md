## 1. 后端数据库层

- [x] 1.1 安装 `aiosqlite` 依赖，在 `requirements.txt` 中添加
- [x] 1.2 创建 `backend/app/db.py`：SQLite 连接管理 + 启动时建表（conversations、messages）
- [x] 1.3 在 `backend/app/main.py` 中注册 startup 事件调用数据库初始化
- [x] 1.4 在 `backend/app/core/config.py` 中添加 `DATABASE_PATH` 配置项（默认 `data/aha_tutor.db`）

## 2. 后端对话 CRUD API

- [x] 2.1 创建 `backend/app/api/v1/conversations.py`：实现 `POST /conversations`（创建对话）
- [x] 2.2 实现 `GET /conversations`（列表，按 updated_at DESC）
- [x] 2.3 实现 `GET /conversations/{id}/messages`（获取对话消息）
- [x] 2.4 实现 `DELETE /conversations/{id}`（删除对话及消息，CASCADE）
- [x] 2.5 在 `backend/app/main.py` 中注册 conversations 路由
- [x] 2.6 创建 Pydantic 响应模型（ConversationResponse、MessageResponse）

## 3. 后端 Chat 端点扩展

- [x] 3.1 修改 `ChatRequest` 模型，添加可选的 `conversation_id` 字段
- [x] 3.2 在 chat 路由中：若提供 `conversation_id`，校验存在性（不存在返回 404）
- [x] 3.3 在 SSE 流完成后，将用户消息和助手完整消息写入 messages 表，更新 conversations.updated_at

## 4. 前端 API 层

- [x] 4.1 创建 `frontend/src/api/conversations.ts`：封装 `createConversation`、`listConversations`、`getMessages`、`deleteConversation` 四个请求函数
- [x] 4.2 修改 `frontend/src/api/chat.ts`：`streamChat` 函数签名扩展，接受可选的 `conversationId` 参数并传入请求体

## 5. 前端状态管理

- [x] 5.1 重构 `frontend/src/store/chatStore.ts`：从单消息数组改为多对话模型（conversations 数组 + currentId）
- [x] 5.2 实现当前消息 getter（conversations[currentId]?.messages ?? []）
- [x] 5.3 实现 `createConversation` action：调用 API + 更新本地状态 + 设置 currentId
- [x] 5.4 实现 `switchConversation` action：从后端加载消息 + 设置 currentId
- [x] 5.5 实现 `deleteConversation` action：调用 API + 移除本地条目 + 处理 currentId
- [x] 5.6 实现 `loadConversations` action：启动时加载对话列表
- [x] 5.7 改造 `sendMessage`：无 currentId 时自动创建对话，有 currentId 时追加到当前对话

## 6. 前端 Hook 适配

- [x] 6.1 修改 `frontend/src/hooks/useChat.ts`：`handleSend` 传递 `conversationId` 给 `streamChat`

## 7. 前端 LeftSidebar 改造

- [x] 7.1 「开启新思」按钮绑定 `chatStore.createConversation()` + 点击后收起侧边栏
- [x] 7.2 nav 区域替换为动态对话列表渲染（从 `chatStore.conversations` 读取）
- [x] 7.3 对话列表项显示 title + 相对时间，当前对话高亮
- [x] 7.4 点击对话项触发 `switchConversation`
- [x] 7.5 hover 显示删除图标，点击触发 `deleteConversation`
- [x] 7.6 无对话时显示空状态提示

## 8. 集成与验证

- [x] 8.1 应用启动时调用 `loadConversations` 加载历史对话列表
- [x] 8.2 端到端验证：新建对话 → 发送消息 → 刷新页面 → 消息仍在
- [x] 8.3 端到端验证：多个对话间切换 → 消息正确隔离
- [x] 8.4 端到端验证：删除对话 → 列表和消息同步清理
