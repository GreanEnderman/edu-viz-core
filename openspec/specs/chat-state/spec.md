## ADDED Requirements

### Requirement: 消息列表状态
`chatStore` SHALL 维护 `messages: Message[]` 数组，每条 `Message` 包含 `id`、`role`（`user` | `assistant`）、`content`（字符串）、`isStreaming`（布尔）字段。

#### Scenario: 添加用户消息
- **WHEN** 用户发送消息
- **THEN** `messages` 追加一条 `role: user` 消息，`isStreaming: false`

#### Scenario: 添加 AI 消息占位
- **WHEN** SSE 连接建立
- **THEN** `messages` 追加一条 `role: assistant`、`content: ""`、`isStreaming: true` 的占位消息

### Requirement: 流式缓冲更新
`chatStore` SHALL 提供 `appendChunk(id, chunk)` action，将 chunk 追加到指定消息的 `content`，触发组件重渲染。

#### Scenario: 追加 chunk
- **WHEN** `appendChunk(id, "hello")` 被调用
- **THEN** 对应消息的 `content` 末尾追加 `"hello"`

### Requirement: 加载与错误状态
`chatStore` SHALL 维护 `isLoading: boolean` 和 `error: string | null`。SSE 连接中 `isLoading` 为 `true`；收到 `done` 或错误后置 `false`。

#### Scenario: 发送中状态
- **WHEN** 用户发送消息且流未结束
- **THEN** `isLoading === true`，输入框禁用

#### Scenario: 完成状态
- **WHEN** 收到 `type: done`
- **THEN** `isLoading === false`，`isStreaming` 置为 `false`，输入框恢复可用

### Requirement: 对话激活状态
`chatStore` SHALL 维护 `isActive: boolean`，初始为 `false`。首次发送消息后置 `true`，驱动欢迎态→对话态视图切换。

#### Scenario: 首次发送激活
- **WHEN** `isActive === false` 且用户发送第一条消息
- **THEN** `isActive` 置为 `true`，UI 切换至对话态
