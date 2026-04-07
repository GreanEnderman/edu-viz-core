## MODIFIED Requirements

### Requirement: 构建含 A2UI 格式指令的 System Prompt
The system SHALL provide a `build_system_prompt(user_id: str) -> str` function in `backend/app/orchestrator/prompt_builder.py` that returns a system prompt string containing A2UI v0.8 output format instructions, the list of available components, and the capabilities of the current user's enabled plugins.

The function SHALL internally query `PluginRegistry` to obtain enabled plugin capabilities for the given `user_id`, rather than accepting `plugin_capabilities` as a parameter.

#### Scenario: 无可用组件时返回基础指令
- **WHEN** `user_id` 对应用户无已启用插件，且 `available_components` 为默认列表
- **THEN** 返回的 prompt 字符串包含 A2UI v0.8 消息序列说明（surfaceUpdate / dataModelUpdate / beginRendering），插件组件区域显示「当前无插件组件」

#### Scenario: 有可用组件时注入组件列表
- **WHEN** 默认 available_components 生效
- **THEN** 返回的 prompt 字符串包含所有默认组件标识符

#### Scenario: 用户已启用插件时注入插件 capabilities
- **WHEN** `user_id` 对应用户已启用 `physics-high-school`，`PhysicsOscillator` capability 含 `a2ui_hint`
- **THEN** 返回的 prompt 字符串中组件能力表包含 `PhysicsOscillator` 行，且 `a2ui_hint` 内容出现在 prompt 中

#### Scenario: 函数结果由用户状态决定，相同 user_id 返回一致结果
- **WHEN** 以相同 `user_id` 连续调用两次 `build_system_prompt`，且期间插件状态未变化
- **THEN** 两次返回值完全相同
