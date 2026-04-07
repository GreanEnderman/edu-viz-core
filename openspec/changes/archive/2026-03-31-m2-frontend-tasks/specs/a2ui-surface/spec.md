## ADDED Requirements

### Requirement: A2UI 渲染容器
`A2UISurface.tsx` SHALL 导出组件 `A2UISurface`，渲染 `<A2UIRenderer surfaceId="main" />`，作为聊天流中 A2UI 消息的渲染占位容器。组件 SHALL 不接受任何 props（surfaceId 硬编码为 `"main"`）。

#### Scenario: A2UI 消息渲染
- **WHEN** A2UI context 中存在 surfaceId `"main"` 的组件状态
- **THEN** `A2UISurface` 渲染出对应的 A2UI 组件

#### Scenario: 无 A2UI 消息时
- **WHEN** A2UI context 中无 `"main"` surface 的状态
- **THEN** `A2UISurface` 渲染空内容，不报错

### Requirement: 容器样式适配聊天流
`A2UISurface` SHALL 在消息列表中以左对齐（AI 消息侧）方式布局，宽度不超过消息列表宽度的 80%，具备最小高度以避免布局坍塌。

#### Scenario: 渲染在对话流中
- **WHEN** `A2UISurface` 出现在 `MessageStream` 的消息列表里
- **THEN** 组件左对齐，宽度受限，与 `TextBubble` 在视觉上保持一致的消息布局

### Requirement: surfaceId 唯一性标注
`A2UISurface.tsx` SHALL 在代码注释中标注：M2 阶段 surfaceId 固定为 `"main"`，多轮对话共享同一 surface state；M3 阶段评估是否需要按消息拆分 surfaceId。

#### Scenario: 代码审查
- **WHEN** 开发者查看 `A2UISurface.tsx`
- **THEN** 注释中可见 surfaceId 设计决策和 M3 待评估事项
