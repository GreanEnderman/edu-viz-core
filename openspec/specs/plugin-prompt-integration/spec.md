## ADDED Requirements

### Requirement: 对话请求时注入当前用户已启用插件的 capabilities
系统 SHALL 在处理 `POST /api/v1/chat` 请求时，从插件注册表查询当前用户已启用插件的 capabilities，并将其注入 `build_system_prompt`，使 LLM 知晓可用的插件组件及其用法。

#### Scenario: 用户已启用插件时 system prompt 包含插件信息
- **WHEN** 用户 `user_1` 已启用 `physics-high-school`，发起对话请求
- **THEN** 生成的 system prompt 的组件能力表中包含 `PhysicsOscillator` 的行，含 `expresses`、`educational_use`、`cannot_express` 列

#### Scenario: 用户未启用任何插件时 system prompt 不含插件组件
- **WHEN** 用户 `user_1` 未启用任何插件，发起对话请求
- **THEN** 生成的 system prompt 的插件组件区域显示「当前无插件组件」

---

### Requirement: system prompt 中插件组件包含完整使用指导
对于每个已启用插件的 capability，system prompt SHALL 包含：
- 组件在能力表中的条目（`component_id`、`expresses`、`educational_use`、`cannot_express`）
- `props_schema` 的字段说明（类型、默认值、取值范围）
- `a2ui_hint`（LLM 使用该组件时的具体指导）

#### Scenario: props_schema 和 a2ui_hint 出现在 prompt 中
- **WHEN** 用户启用了 `physics-high-school`，`PhysicsOscillator` 的 `a2ui_hint` 为「使用 Slider 绑定 amplitude...」
- **THEN** 生成的 system prompt 包含该 a2ui_hint 文本

---

### Requirement: 插件 capabilities 注入不影响无插件时的基础功能
当 `plugin_capabilities` 为空或 None 时，`build_system_prompt` SHALL 与现有行为一致（返回仅含标准组件的 prompt），不引入新的副作用。

#### Scenario: 无插件时 prompt 与现有行为一致
- **WHEN** 调用 `build_system_prompt(user_id)` 且该用户无已启用插件
- **THEN** 返回的 prompt 与调用旧版 `build_system_prompt(plugin_capabilities=None)` 等价
