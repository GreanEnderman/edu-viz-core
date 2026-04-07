## ADDED Requirements

### Requirement: SSE 连接建立
`api/chat.ts` SHALL 通过 `fetch` + `ReadableStream` 向 `POST /api/v1/chat` 建立 SSE 连接，请求体为 `{messages: Message[]}` JSON，Content-Type 为 `application/json`。

#### Scenario: 正常连接
- **WHEN** 调用 `streamChat(messages, onChunk, onDone, onError)`
- **THEN** 向后端发起 POST 请求并开始读取流式响应

### Requirement: SSE 数据格式解析
客户端 SHALL 解析服务端推送的 SSE 行，格式为 `data: <JSON>`。支持两种消息类型：
- `{"type": "text", "content": "..."}` → 调用 `onChunk(content)`
- `{"type": "done"}` → 调用 `onDone()`，关闭流

#### Scenario: 解析 text chunk
- **WHEN** 收到 `data: {"type":"text","content":"hello"}`
- **THEN** 调用 `onChunk("hello")`

#### Scenario: 解析 done 事件
- **WHEN** 收到 `data: {"type":"done"}`
- **THEN** 调用 `onDone()`，停止读取流

### Requirement: 错误处理
网络错误、非 2xx 响应、JSON 解析失败 SHALL 调用 `onError(error)`，不抛出未捕获异常。

#### Scenario: 网络错误
- **WHEN** fetch 请求抛出网络异常
- **THEN** 调用 `onError`，消息列表显示错误提示

### Requirement: Mock 模式
当环境变量 `VITE_USE_MOCK=true` 时，`streamChat` SHALL 在本地模拟 SSE 流（逐字延迟输出固定文本），不发起真实网络请求，用于后端未就绪时的前端独立开发。

#### Scenario: Mock 模式激活
- **WHEN** `VITE_USE_MOCK=true` 且调用 `streamChat`
- **THEN** 无网络请求发出，模拟流式文字输出
