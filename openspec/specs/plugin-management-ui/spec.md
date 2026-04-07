## ADDED Requirements

### Requirement: 插件管理入口
系统 SHALL 在主界面（侧边栏底部）提供插件管理入口，用户点击后展示插件管理面板（modal 或内嵌面板）。

#### Scenario: 点击插件管理入口
- **WHEN** 用户点击侧边栏底部的插件管理入口
- **THEN** 插件管理面板展开/显示，显示所有可用插件列表

---

### Requirement: 展示可用插件列表
插件管理面板 SHALL 显示所有已注册插件的卡片列表，每个卡片包含：插件名称（`name`）、学科（`subject`）、简要说明（通过 `capabilities[].name` 列举可用组件）、当前用户的启用/禁用状态开关。

#### Scenario: 展示插件卡片
- **WHEN** 插件管理面板打开，注册表中有 `physics-high-school`
- **THEN** 面板显示该插件的卡片，包含名称、学科标签和启用开关

#### Scenario: 无可用插件时展示空状态
- **WHEN** 插件管理面板打开，注册表为空
- **THEN** 面板显示空状态提示文案（如「暂无可用插件」）

---

### Requirement: 启用/禁用开关交互
每个插件卡片上的开关 SHALL 调用 `POST /api/v1/plugins/{id}/toggle`，切换后立即更新开关视觉状态，无需刷新页面。

#### Scenario: 用户切换插件启用状态
- **WHEN** 用户点击 `physics-high-school` 卡片上的开关（当前为 disabled）
- **THEN** 开关变为 enabled 状态，调用 toggle API 成功，开关保持 enabled

#### Scenario: API 调用失败时恢复开关状态
- **WHEN** 用户点击开关，toggle API 返回非 2xx 响应
- **THEN** 开关恢复到操作前的状态，页面显示错误提示

---

### Requirement: 插件管理 UI 风格与主页面一致
插件管理面板 SHALL 遵循「The Illuminated Mind」设计规范：使用 `surface`/`surface-container` 背景色阶、`primary`（深靛蓝）配色、Manrope 字体、无 1px 边框分隔、玻璃态卡片（`surface` 80% + `backdrop-blur-xl`）。

#### Scenario: 面板视觉检查
- **WHEN** 插件管理面板在亮色模式下展示
- **THEN** 面板背景为暖奶油色（`#faf9f5`），卡片无硬边框，字体为 Manrope，启用开关使用 `primary` 色
