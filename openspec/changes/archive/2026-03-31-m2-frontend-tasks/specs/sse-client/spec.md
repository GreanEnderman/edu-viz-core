## MODIFIED Requirements

### Requirement: SSE 数据格式解析
客户端 SHALL 解析服务端推送的 SSE 行，格式为 `data: <JSON>`，通过 `StreamSplitter.splitSSELine` 解析。支持三种消息类型：
- `{ type: 'text', content }` → 调用 `onChunk(content)`
- `{ type: 'a2ui', line }` → 调用 `onA2UILine(line)`
- `{ type: 'done' }` → 调用 `onDone()`，关闭流

#### Scenario: 解析 text chunk
- **WHEN** 收到 `data: {"type":"text","content":"hello"}`
- **THEN** 调用 `onChunk("hello")`

#### Scenario: 解析 a2ui 行
- **WHEN** 收到 `data: {"type":"a2ui","line":"{...}"}`
- **THEN** 调用 `onA2UILine("{...}")`

#### Scenario: 解析 done 事件
- **WHEN** 收到 `data: {"type":"done"}`
- **THEN** 调用 `onDone()`，停止读取流

## MODIFIED Requirements

### Requirement: Mock 模式
当环境变量 `VITE_USE_MOCK=true` 时，`streamChat` SHALL 在本地模拟 SSE 流，除逐字延迟输出固定文本外，SHALL 额外模拟至少一条 `type: a2ui` 行（包含合法 A2UI JSONL 内容），以覆盖前端 A2UI 渲染路径验证。不发起真实网络请求。

#### Scenario: Mock 模式激活含 A2UI
- **WHEN** `VITE_USE_MOCK=true` 且调用 `streamChat`
- **THEN** 无网络请求发出，模拟流依次输出文本 chunk 和 a2ui 行，触发 `onChunk` 和 `onA2UILine` 回调
