## ADDED Requirements

### Requirement: SSE 行类型分流
`StreamSplitter.ts` SHALL 导出函数 `splitSSELine(raw: string): SplitResult`，解析单条 SSE `data:` 行的 JSON，根据 `type` 字段返回带类型标签的联合结果：`{ type: 'text', content: string }`、`{ type: 'a2ui', line: string }`、`{ type: 'done' }` 或 `{ type: 'unknown' }`。

#### Scenario: 解析 text 行
- **WHEN** 输入为 `data: {"type":"text","content":"hello"}`
- **THEN** 返回 `{ type: 'text', content: 'hello' }`

#### Scenario: 解析 a2ui 行
- **WHEN** 输入为 `data: {"type":"a2ui","line":"{...}"}`
- **THEN** 返回 `{ type: 'a2ui', line: '{...}' }`

#### Scenario: 解析 done 行
- **WHEN** 输入为 `data: {"type":"done"}`
- **THEN** 返回 `{ type: 'done' }`

#### Scenario: 解析失败
- **WHEN** 输入为非法 JSON 或不含 `type` 字段
- **THEN** 返回 `{ type: 'unknown' }`，不抛出异常

### Requirement: 纯函数，无副作用
`splitSSELine` SHALL 为纯函数：不依赖任何全局状态，不触发 React 渲染，相同输入必须返回相同输出。

#### Scenario: 重复调用
- **WHEN** 对同一 raw 字符串调用两次 `splitSSELine`
- **THEN** 两次返回值深度相等
