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

---

### Requirement: SSE 流支持 a2ui 事件类型
The system SHALL emit `{"type": "a2ui", "line": "<json_string>"}` SSE events when the LLM output contains A2UI JSONL lines, interleaved with existing `text` events in the same stream.

#### Scenario: LLM 输出含 A2UI 行时正确包装
- **WHEN** LLM 流式输出一行合法 A2UI JSONL（如 `{"type":"beginRendering","surfaceId":"main"}`）
- **THEN** 后端发送外层 `type:a2ui`、`line` 字段为内层 JSON 字符串的 SSE 事件

#### Scenario: 同一响应中文本行和 a2ui 行交替出现
- **WHEN** LLM 输出依次为：文本行、A2UI 行、文本行
- **THEN** SSE 流依次发送：`type:text` 事件、`type:a2ui` 事件、`type:text` 事件，顺序保持与 LLM 输出一致

#### Scenario: 非 A2UI JSON 文本不被误判
- **WHEN** LLM 输出一行普通 JSON 字符串（不含 A2UI 消息类型字段，如 `{"foo": "bar"}`）
- **THEN** 后端以 `type:text` 事件发送该行，不作为 `type:a2ui` 处理

---

### Requirement: chat endpoint 调用链接入 prompt_builder
The system SHALL call `prompt_builder.build_system_prompt()` before invoking the LLM, and prepend the returned string as a system message to the messages array sent to the LLM.

#### Scenario: system message 被插入到消息列表最前
- **WHEN** 客户端发送 `messages: [{"role": "user", "content": "你好"}]`
- **THEN** 实际发往 LLM 的消息列表第一条为 `{"role": "system", "content": <prompt_builder 返回值>}`，用户消息排在其后

#### Scenario: 客户端消息列表内容不变
- **WHEN** prompt_builder 被调用
- **THEN** 原始客户端消息列表内容不被修改（无副作用）
