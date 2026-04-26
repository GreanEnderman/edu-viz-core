## MODIFIED Requirements

### Requirement: 插件数据模型（PluginManifest）
系统 SHALL 使用 Pydantic 模型 `PluginManifest` 验证 manifest.json 内容，定义在 `backend/app/models/plugin.py`。
必填字段 SHALL 包含：`id`（str）、`version`（str）、`subject`（str）、`name`（str）、`keywords`（list[str]）、`entry`（含 `js: str` 和可选 `vector_db: str`）、`capabilities`（list[Capability]）。
`PluginManifest` SHALL 另外支持可选字段 `sharedDependencies`（list[str]），用于声明该插件依赖宿主提供的共享运行时依赖。
`Capability` 必填字段 SHALL 包含：`component_id`（str）、`name`（str）、`tags`（list[str]）、`props_schema`（dict）、`a2ui_hint`（str）、`expresses`（list[str]）、`educational_use`（str）、`cannot_express`（list[str]）。

#### Scenario: 合法 manifest 解析成功
- **WHEN** 传入包含所有必填字段的合法 manifest dict，且 `sharedDependencies` 缺省或为字符串数组
- **THEN** `PluginManifest.model_validate(data)` 不抛出异常，返回模型实例

#### Scenario: 缺少必填字段时抛出 ValidationError
- **WHEN** 传入缺少 `id` 字段的 dict
- **THEN** `PluginManifest.model_validate(data)` 抛出 `pydantic.ValidationError`

#### Scenario: sharedDependencies 使用非法类型时校验失败
- **WHEN** manifest 中 `sharedDependencies` 不是字符串数组
- **THEN** `PluginManifest.model_validate(data)` 抛出 `pydantic.ValidationError`

### Requirement: 启动时自动扫描并加载插件
系统 SHALL 在 FastAPI 应用启动（lifespan）时自动扫描 `PLUGINS_DIR`（默认 `/plugins/`）下的所有子目录，读取并解析每个子目录中的 `manifest.json`，将合法插件加载到内存注册表中。
插件加载流程 SHALL 保留 `sharedDependencies` 元数据，以供后续 API 响应、宿主兼容性检查和前端加载路径使用。

#### Scenario: 正常加载单个插件
- **WHEN** `PLUGINS_DIR` 下存在 `physics-high-school/manifest.json` 且格式合法
- **THEN** 该插件被加载到注册表，`registry.get_all_plugins()` 返回包含该插件的列表

#### Scenario: manifest 格式非法时跳过并记录警告
- **WHEN** `PLUGINS_DIR` 下某个子目录的 `manifest.json` 缺少必填字段（如 `id`）
- **THEN** 该插件被跳过，不影响其他插件加载，系统输出 WARNING 日志

#### Scenario: manifest 文件不存在时跳过
- **WHEN** `PLUGINS_DIR` 下某个子目录不含 `manifest.json`
- **THEN** 该子目录被忽略，注册表不包含该条目

#### Scenario: PLUGINS_DIR 目录不存在时正常启动
- **WHEN** 配置的 `PLUGINS_DIR` 路径不存在
- **THEN** 系统正常启动，注册表为空，输出 WARNING 日志
