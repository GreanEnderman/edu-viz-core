## ADDED Requirements

### Requirement: 顶部导航栏
应用 SHALL 在页面顶部渲染固定高度的导航栏，包含左侧菜单图标（触发左侧边栏）、居中 Logo / 标题、右侧图标组（触发右侧边栏）。导航栏背景 SHALL 使用 `surface` 色 + `backdrop-blur`，无 1px 边框分隔，改用背景色阶过渡。

#### Scenario: 初始渲染
- **WHEN** 应用加载完成
- **THEN** 顶部导航栏可见，显示 Logo 和两侧图标

### Requirement: 左侧资料库侧边栏
应用 SHALL 提供可折叠的左侧侧边栏（资料库 / 历史对话），默认展开宽度由设计 token 定义，折叠时宽度为 0 并隐藏内容。折叠状态 SHALL 通过 CSS transition 动画过渡。

#### Scenario: 折叠侧边栏
- **WHEN** 用户点击顶导左侧菜单图标
- **THEN** 左侧边栏以动画折叠，主内容区自动扩展填充

#### Scenario: 展开侧边栏
- **WHEN** 侧边栏已折叠，用户再次点击菜单图标
- **THEN** 左侧边栏以动画展开，主内容区相应收缩

### Requirement: 右侧侧边栏
应用 SHALL 提供可折叠的右侧侧边栏（知识图谱 / 笔记），行为规格与左侧边栏相同，折叠方向相反。

#### Scenario: 折叠右侧边栏
- **WHEN** 用户点击顶导右侧图标
- **THEN** 右侧侧边栏以动画折叠

### Requirement: 主内容区
应用 SHALL 在顶导以下、侧边栏之间渲染主内容区，主内容区 SHALL 根据侧边栏状态自适应宽度，内部渲染对话界面（`chat-interface`）。

#### Scenario: 两栏均展开
- **WHEN** 左右侧边栏均展开
- **THEN** 主内容区占据剩余宽度，不溢出或遮挡侧边栏

### Requirement: 遵循无边框设计规范
所有布局区域边界 SHALL 通过背景色阶、色调分块或负空间（间距）区分，禁止使用 1px solid 边框。组件距视口边缘 SHALL 至少保留 `6`（2rem）内边距。

#### Scenario: 区域分隔
- **WHEN** 两个相邻布局区域渲染
- **THEN** 区域之间无可见边框线，通过背景色差或间距区分
