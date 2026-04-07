## ADDED Requirements

### Requirement: A2UI v0.8 核心消息 Pydantic 模型
The system SHALL define Pydantic models for A2UI v0.8 core messages in `backend/app/models/a2ui_schema.py`: `SurfaceUpdateMessage`, `DataModelUpdateMessage`, `BeginRenderingMessage`，以及 Union 类型别名 `A2UIMessage = Union[SurfaceUpdateMessage, DataModelUpdateMessage, BeginRenderingMessage]`。

#### Scenario: SurfaceUpdateMessage 校验合法输入
- **WHEN** 构造 `SurfaceUpdateMessage(type="surfaceUpdate", surfaceId="main", components=[])`
- **THEN** 对象创建成功，`model.type` 为 `"surfaceUpdate"`

#### Scenario: DataModelUpdateMessage 校验合法输入
- **WHEN** 构造 `DataModelUpdateMessage(type="dataModelUpdate", surfaceId="main", data={"k": 1})`
- **THEN** 对象创建成功，`model.data` 为 `{"k": 1}`

#### Scenario: BeginRenderingMessage 校验合法输入
- **WHEN** 构造 `BeginRenderingMessage(type="beginRendering", surfaceId="main")`
- **THEN** 对象创建成功，`model.surfaceId` 为 `"main"`

#### Scenario: type 字段错误时校验失败
- **WHEN** 构造 `SurfaceUpdateMessage(type="wrongType", surfaceId="main", components=[])`
- **THEN** 抛出 `ValidationError`

#### Scenario: 模型可序列化为 JSON
- **WHEN** 调用 `model.model_dump()` 或 `model.model_dump_json()`
- **THEN** 返回包含所有字段的合法 dict / JSON 字符串，无 Pydantic 内部元数据
