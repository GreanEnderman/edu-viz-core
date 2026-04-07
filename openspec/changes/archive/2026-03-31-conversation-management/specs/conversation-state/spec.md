## ADDED Requirements

### Requirement: Multi-conversation state model
`chatStore` SHALL 从单消息数组模型重构为多对话模型，维护 `conversations` 数组和 `currentId` 字段。

#### Scenario: Store 初始状态
- **WHEN** 应用首次加载（无本地数据）
- **THEN** `conversations` 为空数组 `[]`，`currentId` 为 `null`，`isLoading` 为 `false`，`error` 为 `null`

### Requirement: Current messages accessor
Store SHALL 提供便捷的当前消息访问方式，返回 `conversations[currentId]?.messages ?? []`。

#### Scenario: 有活跃对话时
- **WHEN** `currentId` 指向一个存在的对话
- **THEN** 可通过 getter 获取该对话的消息数组

#### Scenario: 无活跃对话时
- **WHEN** `currentId` 为 `null`
- **THEN** getter 返回空数组

### Requirement: Create conversation action
Store SHALL 提供 `createConversation` 异步 action，调用后端 API 创建对话并更新本地状态。

#### Scenario: 成功创建对话
- **WHEN** 调用 `createConversation()`
- **THEN** 系统调用 `POST /api/v1/conversations`，成功后将新对话添加到 `conversations` 数组，设置 `currentId` 为新对话 ID，并返回新对话 ID

#### Scenario: 创建失败
- **WHEN** 调用 `createConversation()` 但 API 请求失败
- **THEN** `error` 字段设置为错误信息，`conversations` 和 `currentId` 不变

### Requirement: Switch conversation action
Store SHALL 提供 `switchConversation` 异步 action，切换当前活跃对话。

#### Scenario: 切换到存在的对话
- **WHEN** 调用 `switchConversation(id)` 且该对话在 `conversations` 中已存在
- **THEN** 系统从后端加载该对话的消息，设置 `currentId` 为 `id`，用加载的消息替换本地缓存

#### Scenario: 切换到不存在的对话
- **WHEN** 调用 `switchConversation(id)` 且该对话 ID 不在本地列表中
- **THEN** `error` 字段设置为错误信息，`currentId` 不变

### Requirement: Delete conversation action
Store SHALL 提供 `deleteConversation` 异步 action，删除指定对话。

#### Scenario: 删除当前对话
- **WHEN** 调用 `deleteConversation(id)` 且 `id` 等于 `currentId`
- **THEN** 系统调用 `DELETE /api/v1/conversations/{id}`，成功后从 `conversations` 中移除，`currentId` 设为 `null`

#### Scenario: 删除非当前对话
- **WHEN** 调用 `deleteConversation(id)` 且 `id` 不等于 `currentId`
- **THEN** 系统从 `conversations` 中移除该对话，`currentId` 不变

### Requirement: Load conversations action
Store SHALL 提供 `loadConversations` 异步 action，在应用启动时从后端加载对话列表。

#### Scenario: 启动时加载
- **WHEN** 调用 `loadConversations()`
- **THEN** 系统调用 `GET /api/v1/conversations`，用返回结果替换 `conversations` 数组，`currentId` 保持 `null`（用户需手动选择对话）

### Requirement: Message operations preserve per-conversation scope
现有的 `sendMessage`、`appendChunk`、`finishMessage`、`addA2UIMessage` 操作 SHALL 作用于 `conversations[currentId].messages`。

#### Scenario: 在活跃对话中发送消息
- **WHEN** `currentId` 不为 `null` 且调用 `sendMessage(text)`
- **THEN** 用户消息和助手占位消息追加到当前对话的 `messages` 数组，返回助手消息 ID

#### Scenario: 无活跃对话时发送消息
- **WHEN** `currentId` 为 `null` 且调用 `sendMessage(text)`
- **THEN** 自动调用 `createConversation()` 创建新对话，然后在新对话中追加消息
