## ADDED Requirements

### Requirement: A2UI 消息工厂函数
The system SHALL provide factory functions in `backend/app/orchestrator/a2ui_builder.py` for constructing A2UI v0.8 core messages: `surface_update(surface_id: str, components: list) -> dict`, `data_model_update(surface_id: str, data: dict) -> dict`, `begin_rendering(surface_id: str) -> dict`.

#### Scenario: surface_update 返回合法结构
- **WHEN** 调用 `surface_update("main", [{"type": "Slider"}])`
- **THEN** 返回包含 `{"type": "surfaceUpdate", "surfaceId": "main", "components": [{"type": "Slider"}]}` 的 dict

#### Scenario: data_model_update 返回合法结构
- **WHEN** 调用 `data_model_update("main", {"amplitude": 5})`
- **THEN** 返回包含 `{"type": "dataModelUpdate", "surfaceId": "main", "data": {"amplitude": 5}}` 的 dict

#### Scenario: begin_rendering 返回合法结构
- **WHEN** 调用 `begin_rendering("main")`
- **THEN** 返回包含 `{"type": "beginRendering", "surfaceId": "main"}` 的 dict

---

### Requirement: 将 A2UI 消息序列化为 SSE a2ui 事件
The system SHALL provide `to_sse_event(msg: dict) -> str` in `backend/app/orchestrator/a2ui_builder.py` that serializes an A2UI message dict into a complete SSE event string.

#### Scenario: 序列化输出格式正确
- **WHEN** 调用 `to_sse_event({"type": "beginRendering", "surfaceId": "main"})`
- **THEN** 返回字符串外层包含 `type: a2ui` 字段，`line` 字段为内层 JSON 字符串，整体以 `\n\n` 结尾

#### Scenario: line 字段为合法 JSON 字符串
- **WHEN** 解析 `to_sse_event` 输出中的 `data` JSON，提取 `line` 字段并再次 JSON parse
- **THEN** 得到与原始 `msg` 等价的 dict
