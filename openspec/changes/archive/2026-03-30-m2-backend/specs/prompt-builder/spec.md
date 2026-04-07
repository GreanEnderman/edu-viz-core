## ADDED Requirements

### Requirement: 构建含 A2UI 格式指令的 System Prompt
The system SHALL provide a `build_system_prompt(available_components: list[dict]) -> str` function in `backend/app/orchestrator/prompt_builder.py` that returns a system prompt string containing A2UI v0.8 output format instructions and the list of available components.

#### Scenario: 无可用组件时返回基础指令
- **WHEN** `available_components` 为空列表
- **THEN** 返回的 prompt 字符串包含 A2UI v0.8 消息序列说明（surfaceUpdate / dataModelUpdate / beginRendering），且不含组件列表内容

#### Scenario: 有可用组件时注入组件列表
- **WHEN** `available_components` 为 `[{"id": "Button"}, {"id": "Slider"}]`
- **THEN** 返回的 prompt 字符串包含 `Button` 和 `Slider` 的标识符

#### Scenario: 函数为纯函数，无副作用
- **WHEN** 以相同参数连续调用两次 `build_system_prompt`
- **THEN** 两次返回值完全相同
