## ADDED Requirements

### Requirement: SSE 流支持 a2ui 事件类型
The system SHALL emit `{"type": "a2ui", "line": "<json_string>"}` SSE events when the LLM output contains A2UI JSONL lines, interleaved with existing `text` events in the same stream.

#### Scenario: LLM 输出含 A2UI 行时正确包装
- **WHEN** LLM 流式输出一行合法 A2UI JSONL（如 `{"type":"beginRendering","surfaceId":"main"}`）
- **THEN** 后端发送 `data: {"type":"a2ui","line":"{\"type\":\"beginRendering\",\"surfaceId\":\"main\"}"}\ n\ n`

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
