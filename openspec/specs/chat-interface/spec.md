## ADDED Requirements

### Requirement: 欢迎态（初始视图）
首次进入或无对话记录时，应用 SHALL 渲染欢迎态：主内容区垂直居中显示大标题 + 副标题 + 居中输入框。此时底部固定输入栏 SHALL 隐藏。

#### Scenario: 应用初始加载
- **WHEN** 用户打开应用且无对话历史
- **THEN** 显示欢迎态居中布局，输入框位于页面视觉中心

### Requirement: 对话态激活
用户在欢迎态输入框发送第一条消息后，界面 SHALL 以动画过渡至对话态：居中欢迎区域收起，消息列表从顶部出现，底部固定输入栏展现。过渡动画 SHALL 使用 CSS transition，时长不超过 400ms。

#### Scenario: 发送第一条消息
- **WHEN** 用户在欢迎态输入内容并按 Enter 或点击发送
- **THEN** 界面平滑过渡到对话态，用户消息出现在消息列表

### Requirement: 消息列表渲染
对话态 SHALL 渲染可滚动的消息列表，每条消息以 `TextBubble` 组件呈现，区分用户消息（右对齐）与 AI 消息（左对齐）。新消息到达时列表 SHALL 自动滚动至底部。

#### Scenario: AI 流式响应
- **WHEN** 后端 SSE 流推送 text chunk
- **THEN** AI 消息气泡逐字追加内容，页面自动滚动至最新内容

#### Scenario: 消息发送完成
- **WHEN** 收到 `type: done` 事件
- **THEN** AI 消息气泡内容固定，加载状态清除

### Requirement: 底部输入栏
对话态 SHALL 在页面底部固定渲染输入栏，包含文本输入框和发送按钮。输入框 SHALL 支持多行输入（最大高度限制），按 Enter 发送（Shift+Enter 换行），发送按钮在输入为空时 SHALL 禁用。

#### Scenario: 回车发送
- **WHEN** 用户在输入框按下 Enter（非 Shift+Enter）
- **THEN** 消息发送，输入框清空

#### Scenario: 空消息禁止发送
- **WHEN** 输入框为空
- **THEN** 发送按钮处于禁用状态，Enter 无效

### Requirement: TextBubble 流式渲染
AI 消息 SHALL 使用 `TextBubble` 组件渲染，支持流式追加文本内容。流式进行中 SHALL 显示光标动画，流式结束后光标消失。组件 SHALL 支持 Markdown 基础格式（粗体、代码块、列表）。

#### Scenario: 流式文字逐字出现
- **WHEN** SSE 推送多个 text chunk
- **THEN** 每个 chunk 追加到气泡末尾，用户可见逐字显示效果

#### Scenario: 流式结束
- **WHEN** 收到 `type: done`
- **THEN** 光标动画停止，气泡内容完整呈现
