## MODIFIED Requirements

### Requirement: GET /api/v1/plugins 返回插件列表与用户启用状态
系统 SHALL 提供 `GET /api/v1/plugins` 端点，返回所有已注册插件的列表。每个插件条目 SHALL 包含：`id`、`name`、`version`、`subject`、`keywords`、`capabilities`（摘要：`component_id`、`name`、`tags`）、`enabled`（当前用户的启用状态，bool）。
每个插件条目 SHALL 另外包含 `sharedDependencies` 字段，用于向宿主暴露该插件依赖的共享运行时库列表。

#### Scenario: 有插件注册时返回完整列表
- **WHEN** 注册表中存在 `physics-high-school` 插件，用户 `user_1` 已启用该插件，请求 `GET /api/v1/plugins`
- **THEN** 响应 HTTP 200，body 包含 `physics-high-school` 条目，其 `enabled` 为 `true`

#### Scenario: 无插件注册时返回空列表
- **WHEN** 注册表为空，请求 `GET /api/v1/plugins`
- **THEN** 响应 HTTP 200，body 为 `[]`

#### Scenario: 未启用的插件 enabled 为 false
- **WHEN** 用户 `user_1` 未设置过 `physics-high-school` 的状态，请求 `GET /api/v1/plugins`
- **THEN** `physics-high-school` 条目的 `enabled` 为 `false`

#### Scenario: 返回共享运行时依赖信息
- **WHEN** 已注册插件 manifest 声明 `sharedDependencies` 为 `["react", "react-dom", "@a2ui/react"]`
- **THEN** `GET /api/v1/plugins` 的对应插件条目包含相同的 `sharedDependencies` 数组

### Requirement: 插件 JS 文件通过静态文件服务提供
系统 SHALL 将 `PLUGINS_DIR` 目录挂载为静态文件路由（`/plugins/`），使前端可通过 `GET /plugins/{plugin_id}/{entry.js}` 获取插件构建产物。
静态文件服务 SHALL 与共享运行时模型兼容，即允许插件 bundle 依赖宿主提供的共享库，而不要求 bundle 自带这些运行时实现。

#### Scenario: 请求已存在的插件 JS 文件
- **WHEN** 请求 `GET /plugins/physics-high-school/dist/index.esm.js`，文件存在
- **THEN** 响应 HTTP 200，`Content-Type` 为 `application/javascript` 或 `text/javascript`

#### Scenario: 请求不存在的文件
- **WHEN** 请求 `GET /plugins/physics-high-school/dist/nonexistent.js`
- **THEN** 响应 HTTP 404
