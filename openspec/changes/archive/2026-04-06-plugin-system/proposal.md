## Why

系统当前只支持 A2UI 标准组件（Slider、Button 等），无法为特定学科提供专业交互组件（如物理模拟器、几何画板）。需要构建插件系统，让学科专家开发的交互组件能够动态接入系统，按用户需求启用/禁用，并让 LLM 自动感知可用插件并正确调用。

## What Changes

- 新增后端插件基础设施：manifest 解析、内存注册表、启动时自动发现与加载
- 新增插件用户状态管理：按用户启用/禁用插件，`plugin_user_settings` 表
- 新增插件 API：`GET /api/v1/plugins`（列表+状态）、`POST /api/v1/plugins/{id}/toggle`（切换启用）
- 新增后端静态文件服务：挂载 `/plugins/` 目录，支持前端动态加载插件 JS
- **BREAKING** 更新 manifest.json 规范：新增 `entry.js` 字段（指向构建产物），替代原有的 React 静态导入方式
- 重构前端 CatalogRegistry：从静态导入改为 ESM 动态 import()，启动时根据用户已启用插件按需加载
- 新增插件管理 UI：设置页面展示可用插件列表与启用/禁用开关
- 更新 prompt_builder：从注册表读取当前用户已启用插件的 capabilities，注入 system prompt
- 实现首个示例插件：physics-high-school（PhysicsOscillator 简谐运动模拟器）
- 提供插件开发者工具：脚手架模板、manifest AI Prompt 模板、知识库构建 CLI

## Capabilities

### New Capabilities
- `plugin-loading`: 插件发现、manifest 解析、内存注册表、启动时自动加载与按用户启用/禁用状态管理
- `plugin-api`: 插件列表查询与启用/禁用切换的 REST API，以及插件 JS 文件的静态服务
- `plugin-dynamic-import`: 前端根据用户已启用插件动态加载 ESM 组件并注册到 A2UI ComponentRegistry
- `plugin-management-ui`: 插件管理设置页面，展示可用插件与启用/禁用开关
- `plugin-prompt-integration`: 将已启用插件的 capabilities（props_schema、a2ui_hint）注入 LLM system prompt
- `plugin-dev-tools`: 插件脚手架模板、manifest AI Prompt 模板、知识库构建 CLI 工具

### Modified Capabilities
- `prompt-builder`: 新增从插件注册表读取已启用插件 capabilities 并注入 prompt 的能力；`build_system_prompt` 函数签名扩展 `plugin_capabilities` 参数的使用方式（从手动传参改为自动从 registry 获取）

## Impact

- **后端新增文件**：`backend/app/models/plugin.py`、`backend/app/plugins_manager/loader.py`、`backend/app/plugins_manager/registry.py`、`backend/app/routers/plugins.py`
- **后端修改文件**：`backend/app/core/config.py`（新增 PLUGINS_DIR）、`backend/app/orchestrator/prompt_builder.py`（集成插件 capabilities）、`backend/app/main.py`（lifespan 加载插件、注册路由和静态文件）
- **后端新增数据库表**：`plugin_user_settings`（user_id, plugin_id, enabled）
- **前端修改文件**：`frontend/src/a2ui-engine/CatalogRegistry.ts`（动态加载重构）
- **前端新增文件**：插件管理 UI 组件
- **新增目录**：`/plugins/physics-high-school/`（首个示例插件）
- **依赖**：manifest.json 格式变更需同步更新 `design/architecture.md` 中的插件规范
