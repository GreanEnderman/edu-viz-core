## ADDED Requirements

### Requirement: Chat 端点接受消息列表
The system SHALL expose `POST /api/v1/chat` that accepts a JSON body with a `messages` array, where each message has `role` (`"user"` | `"assistant"`) and `content` (string) fields.

#### Scenario: 合法请求被接受
- **WHEN** 客户端发送 `POST /api/v1/chat` with `{"messages": [{"role": "user", "content": "你好"}]}`
- **THEN** 服务返回 HTTP 200，Content-Type 为 `text/event-stream`

#### Scenario: 空消息列表被拒绝
- **WHEN** 客户端发送 `{"messages": []}`
- **THEN** 服务返回 HTTP 422 Unprocessable Entity

#### Scenario: 缺少 messages 字段被拒绝
- **WHEN** 客户端发送 `{}`
- **THEN** 服务返回 HTTP 422 Unprocessable Entity

---

### Requirement: SSE 流式返回 LLM 响应
The system SHALL stream LLM responses as Server-Sent Events, where each event is a line in the format `data: <json>\n\n`.

#### Scenario: 文本块正常流式输出
- **WHEN** LLM 输出文本内容时
- **THEN** 每个文本块以 `data: {"type": "text", "content": "<chunk>"}\n\n` 格式发送

#### Scenario: 流结束时发送 done 事件
- **WHEN** LLM 输出完成
- **THEN** 最后发送 `data: {"type": "done"}\n\n` 并关闭连接

#### Scenario: LLM 调用失败时返回错误事件
- **WHEN** LLM API 调用抛出异常
- **THEN** 发送 `data: {"type": "error", "message": "<error>"}\n\n` 后关闭连接，不泄露内部堆栈

---

### Requirement: SSE 数据格式契约
The `type` field in SSE events SHALL be the sole discriminator for event routing. Valid values in M1: `"text"` | `"done"` | `"error"`.

#### Scenario: 前端可通过 type 字段分流
- **WHEN** 前端 StreamSplitter 接收到 `type: "text"` 事件
- **THEN** 将 `content` 字段追加到对话气泡文本

#### Scenario: 前端收到 done 事件后停止读取
- **WHEN** 前端接收到 `type: "done"` 事件
- **THEN** 关闭 SSE 连接，标记消息为完成状态

#### Scenario: 未知 type 值被安全忽略
- **WHEN** 前端接收到未知 `type` 值（如未来新增的 `"a2ui"` 类型）
- **THEN** 前端不抛出错误，忽略该事件继续读取后续事件
