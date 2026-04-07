## 1. A2UI Schema 模型

- [x] 1.1 新建 `backend/app/models/a2ui_schema.py`，定义 `SurfaceUpdateMessage` Pydantic 模型（字段：`type: Literal["surfaceUpdate"]`、`surfaceId: str`、`components: list`）
- [x] 1.2 在同文件定义 `DataModelUpdateMessage`（字段：`type: Literal["dataModelUpdate"]`、`surfaceId: str`、`data: dict`）
- [x] 1.3 在同文件定义 `BeginRenderingMessage`（字段：`type: Literal["beginRendering"]`、`surfaceId: str`）
- [x] 1.4 在同文件定义 `A2UIMessage = Union[SurfaceUpdateMessage, DataModelUpdateMessage, BeginRenderingMessage]`，并从 `__init__.py` 导出

## 2. A2UI Builder

- [x] 2.1 新建 `backend/app/orchestrator/a2ui_builder.py`，实现 `surface_update(surface_id: str, components: list) -> dict` 工厂函数
- [x] 2.2 实现 `data_model_update(surface_id: str, data: dict) -> dict` 工厂函数
- [x] 2.3 实现 `begin_rendering(surface_id: str) -> dict` 工厂函数
- [x] 2.4 实现 `to_sse_event(msg: dict) -> str`：将 A2UI dict 序列化为 `data: {"type":"a2ui","line":"<json_escaped>"}\n\n` 格式字符串

## 3. Prompt Builder

- [x] 3.1 新建 `backend/app/orchestrator/prompt_builder.py`，实现 `build_system_prompt(available_components: list[dict]) -> str`
- [x] 3.2 在函数中内嵌 A2UI v0.8 格式指令模板（消息序列说明：surfaceUpdate → dataModelUpdate → beginRendering）
- [x] 3.3 将 `available_components` 中各组件 `id` 注入到 prompt 的组件列表部分
- [x] 3.4 硬编码默认示例组件列表 `[{"id": "Button"}, {"id": "Slider"}]` 供 M2 阶段调用时传入

## 4. Chat Endpoint 更新

- [x] 4.1 在 `backend/app/api/v1/chat.py` 中 import `prompt_builder.build_system_prompt`
- [x] 4.2 在 handler 中于调用 LLM 前调用 `build_system_prompt`，将返回值作为 `{"role": "system", "content": ...}` 插入消息列表首位
- [x] 4.3 实现 LLM 输出流的逐行扫描：尝试 JSON parse 每一行，若成功且 `type` 字段值在 `{surfaceUpdate, dataModelUpdate, beginRendering}` 中，则调用 `to_sse_event` 包装为 `a2ui` 事件发送
- [x] 4.4 非 A2UI 行继续以 `data: {"type":"text","content":"..."}\n\n` 格式发送（保持 M1 行为不变）
- [x] 4.5 确认 `done` 和 `error` 事件类型逻辑不受影响

## 5. 验证

- [x] 5.1 启动后端，用 curl 或 HTTPie 发送请求，确认响应中同时出现 `type:text` 和 `type:a2ui` 事件
- [x] 5.2 确认 `type:a2ui` 事件的 `line` 字段可被二次 JSON parse 得到合法 A2UI 消息对象
- [x] 5.3 确认普通文本输出不被误判为 A2UI 行
