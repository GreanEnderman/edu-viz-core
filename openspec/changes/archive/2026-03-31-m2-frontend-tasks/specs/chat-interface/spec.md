## MODIFIED Requirements

### Requirement: 消息列表渲染
对话态 SHALL 渲染可滚动的消息列表，每条消息根据类型渲染：用户消息和 AI 文本消息以 `TextBubble` 组件呈现（用户消息右对齐，AI 消息左对齐）；AI A2UI 消息以 `A2UISurface` 组件呈现（左对齐）。新消息到达时列表 SHALL 自动滚动至底部。

#### Scenario: AI 流式响应
- **WHEN** 后端 SSE 流推送 text chunk
- **THEN** AI 消息气泡逐字追加内容，页面自动滚动至最新内容

#### Scenario: 消息发送完成
- **WHEN** 收到 `type: done` 事件
- **THEN** AI 消息气泡内容固定，加载状态清除

#### Scenario: A2UI 消息渲染
- **WHEN** SSE 流推送 `type: a2ui` 行
- **THEN** 消息列表中出现 `A2UISurface` 占位，A2UI 组件在其中渲染

#### Scenario: 混合消息序列
- **WHEN** 同一轮 AI 响应中先后出现 text chunk 和 a2ui 行
- **THEN** 文本气泡和 A2UI Surface 均出现在消息列表中，顺序与接收顺序一致
