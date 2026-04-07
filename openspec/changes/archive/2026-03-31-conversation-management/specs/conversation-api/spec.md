## ADDED Requirements

### Requirement: Create conversation
系统 SHALL 提供 `POST /api/v1/conversations` 端点，创建新的对话记录并返回对话元数据。

#### Scenario: 成功创建对话
- **WHEN** 客户端发送 `POST /api/v1/conversations`（无请求体）
- **THEN** 系统创建一条新对话记录，自动生成 UUID 作为 `id`，`title` 默认为「新对话」，返回 `201` 及 `{ id, title, created_at, updated_at }`

### Requirement: List conversations
系统 SHALL 提供 `GET /api/v1/conversations` 端点，返回所有对话列表。

#### Scenario: 获取对话列表
- **WHEN** 客户端发送 `GET /api/v1/conversations`
- **THEN** 系统返回 `200` 及对话数组，按 `updated_at DESC` 排序，每项包含 `{ id, title, created_at, updated_at }`

#### Scenario: 无对话时返回空列表
- **WHEN** 数据库中没有任何对话记录
- **THEN** 系统返回 `200` 及空数组 `[]`

### Requirement: Get conversation messages
系统 SHALL 提供 `GET /api/v1/conversations/:id/messages` 端点，返回指定对话的全部消息。

#### Scenario: 获取存在的对话消息
- **WHEN** 客户端发送 `GET /api/v1/conversations/{id}/messages` 且该对话存在
- **THEN** 系统返回 `200` 及消息数组，按 `created_at ASC` 排序，每项包含 `{ id, role, type, content, created_at }`

#### Scenario: 对话不存在
- **WHEN** 客户端发送 `GET /api/v1/conversations/{id}/messages` 且该对话不存在
- **THEN** 系统返回 `404` 及错误信息

### Requirement: Delete conversation
系统 SHALL 提供 `DELETE /api/v1/conversations/:id` 端点，删除对话及其所有消息。

#### Scenario: 成功删除对话
- **WHEN** 客户端发送 `DELETE /api/v1/conversations/{id}` 且该对话存在
- **THEN** 系统删除该对话及关联的所有消息，返回 `204`（无响应体）

#### Scenario: 删除不存在的对话
- **WHEN** 客户端发送 `DELETE /api/v1/conversations/{id}` 且该对话不存在
- **THEN** 系统返回 `404` 及错误信息

### Requirement: Chat endpoint accepts conversation_id
现有 `POST /api/v1/chat` 端点 SHALL 接受可选的 `conversation_id` 字段。提供时，系统 SHALL 在流式响应完成后自动持久化用户消息和助手消息到数据库。

#### Scenario: 带 conversation_id 发送消息
- **WHEN** 客户端发送 `POST /api/v1/chat` 且请求体包含有效的 `conversation_id`
- **THEN** 系统正常执行 LLM 流式响应，响应完成后将用户消息和助手完整消息写入 `messages` 表，并更新该对话的 `updated_at`

#### Scenario: 不带 conversation_id 发送消息
- **WHEN** 客户端发送 `POST /api/v1/chat` 且请求体不包含 `conversation_id`
- **THEN** 系统行为与现有逻辑完全一致，不写入数据库

#### Scenario: conversation_id 不存在
- **WHEN** 客户端发送 `POST /api/v1/chat` 且 `conversation_id` 在数据库中不存在
- **THEN** 系统返回 `404` 及错误信息，不执行 LLM 调用

### Requirement: Database initialization
系统 SHALL 在应用启动时自动初始化 SQLite 数据库，创建 `conversations` 和 `messages` 表（如不存在）。

#### Scenario: 首次启动
- **WHEN** 应用启动且数据库文件不存在
- **THEN** 系统自动创建数据库文件并执行建表语句，应用正常启动

#### Scenario: 数据库已存在
- **WHEN** 应用启动且数据库文件已包含表结构
- **THEN** 系统跳过建表，应用正常启动
