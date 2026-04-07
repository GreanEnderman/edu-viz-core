## ADDED Requirements

### Requirement: 启动时自动扫描并加载插件
系统 SHALL 在 FastAPI 应用启动（lifespan）时自动扫描 `PLUGINS_DIR`（默认 `/plugins/`）下的所有子目录，读取并解析每个子目录中的 `manifest.json`，将合法插件加载到内存注册表中。

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

---

### Requirement: 插件数据模型（PluginManifest）
系统 SHALL 使用 Pydantic 模型 `PluginManifest` 验证 manifest.json 内容，定义在 `backend/app/models/plugin.py`。

必填字段：`id`（str）、`version`（str）、`subject`（str）、`name`（str）、`keywords`（list[str]）、`entry`（含 `js: str` 和可选 `vector_db: str`）、`capabilities`（list[Capability]）。

`Capability` 必填字段：`component_id`（str）、`name`（str）、`tags`（list[str]）、`props_schema`（dict）、`a2ui_hint`（str）、`expresses`（list[str]）、`educational_use`（str）、`cannot_express`（list[str]）。

#### Scenario: 合法 manifest 解析成功
- **WHEN** 传入包含所有必填字段的合法 manifest dict
- **THEN** `PluginManifest.model_validate(data)` 不抛出异常，返回模型实例

#### Scenario: 缺少必填字段时抛出 ValidationError
- **WHEN** 传入缺少 `id` 字段的 dict
- **THEN** `PluginManifest.model_validate(data)` 抛出 `pydantic.ValidationError`

---

### Requirement: 按用户维护插件启用/禁用状态
系统 SHALL 在数据库中维护 `plugin_user_settings` 表（字段：`user_id TEXT, plugin_id TEXT, enabled INTEGER`，主键为 `(user_id, plugin_id)`），记录每个用户对每个插件的启用状态。

若某 `(user_id, plugin_id)` 组合在表中无记录，系统 SHALL 默认视为 disabled。

#### Scenario: 新用户首次访问插件列表
- **WHEN** 用户 `user_1` 从未设置过任何插件状态，调用 `get_user_plugin_states(user_id="user_1")`
- **THEN** 返回所有已注册插件的状态列表，每个插件的 `enabled` 均为 `false`

#### Scenario: 切换插件启用状态
- **WHEN** 对 `(user_id="user_1", plugin_id="physics-high-school")` 调用 toggle，当前状态为 disabled
- **THEN** 数据库中该记录的 `enabled` 变为 `1`，再次 toggle 后变回 `0`

---

### Requirement: 内存注册表提供 capabilities 查询接口
系统 SHALL 提供 `PluginRegistry` 单例，支持：
- `get_all_plugins() -> list[PluginManifest]`：返回所有已加载插件
- `get_enabled_capabilities(enabled_plugin_ids: list[str]) -> list[dict]`：返回指定插件的所有 capability 信息（含 `component_id`、`props_schema`、`a2ui_hint`、`expresses`、`educational_use`、`cannot_express`）

#### Scenario: 查询已启用插件的 capabilities
- **WHEN** 注册表中已加载 `physics-high-school`（含 `PhysicsOscillator` capability），调用 `get_enabled_capabilities(["physics-high-school"])`
- **THEN** 返回列表包含 `PhysicsOscillator` 的完整 capability dict

#### Scenario: 查询空列表返回空结果
- **WHEN** 调用 `get_enabled_capabilities([])`
- **THEN** 返回空列表
