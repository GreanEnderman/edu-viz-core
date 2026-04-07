## ADDED Requirements

### Requirement: New conversation button triggers creation
LeftSidebar 中的「开启新思」按钮 SHALL 调用 `chatStore.createConversation()`，创建新对话并切换到该对话。

#### Scenario: 点击「开启新思」
- **WHEN** 用户点击「开启新思」按钮
- **THEN** 系统创建新对话，`currentId` 设为新对话，侧边栏刷新显示新对话项，主区域显示欢迎界面

### Requirement: Conversation list renders from store
LeftSidebar 的 nav 区域 SHALL 从 `chatStore.conversations` 动态渲染对话列表，替代现有静态占位项。

#### Scenario: 有对话时显示列表
- **WHEN** `conversations` 包含 N 条记录
- **THEN** nav 区域渲染 N 个对话项，每项显示对话 `title`，按列表顺序排列

#### Scenario: 无对话时显示空状态
- **WHEN** `conversations` 为空数组
- **THEN** nav 区域显示空状态提示（如「暂无对话」）

### Requirement: Conversation list item shows title and relative time
每个对话列表项 SHALL 显示对话标题和相对时间（如「刚刚」「5分钟前」）。

#### Scenario: 正常显示
- **WHEN** 对话存在且有 `title` 和 `updated_at`
- **THEN** 列表项显示 `title`，下方以小字显示相对时间

### Requirement: Active conversation is highlighted
当前 `currentId` 对应的对话列表项 SHALL 使用高亮样式（复用现有 `bg-white rounded-lg` 样式）。

#### Scenario: 切换对话后高亮
- **WHEN** 用户点击某对话项
- **THEN** 该项切换为高亮样式，之前高亮的项恢复正常样式

### Requirement: Click conversation item to switch
点击对话列表项 SHALL 调用 `chatStore.switchConversation(id)`，加载该对话消息并切换视图。

#### Scenario: 点击非当前对话
- **WHEN** 用户点击一个非当前活跃的对话项
- **THEN** 系统调用 `switchConversation(id)`，加载该对话的消息，主区域更新为该对话内容

### Requirement: Delete conversation via UI
对话列表项 SHALL 提供 hover 时出现的删除操作入口。

#### Scenario: Hover 显示删除
- **WHEN** 用户鼠标悬停在某个对话项上
- **THEN** 该项右侧出现删除图标

#### Scenario: 点击删除
- **WHEN** 用户点击删除图标
- **THEN** 系统调用 `deleteConversation(id)`，对话从列表中移除。若删除的是当前对话，主区域切换为欢迎界面

### Requirement: Preserve existing sidebar animation
LeftSidebar 的展开/收起动画、收起按钮、整体样式 SHALL 保持不变。

#### Scenario: 展开/收起正常
- **WHEN** 用户触发侧边栏展开或收起
- **THEN** 动画效果与改造前一致，对话列表内容随侧边栏一起动画
