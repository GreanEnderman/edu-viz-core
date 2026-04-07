## 1. 后端基础设施

- [x] 1.1 在 `backend/app/core/config.py` 新增 `PLUGINS_DIR: str = "plugins"` 配置项
- [x] 1.2 创建 `backend/app/models/plugin.py`：定义 `PropsFieldSchema`、`Capability`、`PluginEntry`、`PluginManifest` Pydantic 模型
- [x] 1.3 创建 `backend/app/plugins_manager/` 目录及 `__init__.py`
- [x] 1.4 实现 `backend/app/plugins_manager/loader.py`：扫描 `PLUGINS_DIR`，读取并用 `PluginManifest` 校验各子目录的 `manifest.json`，格式非法或文件不存在时跳过并输出 WARNING
- [x] 1.5 实现 `backend/app/plugins_manager/registry.py`：`PluginRegistry` 单例，提供 `load_all()`、`get_all_plugins()`、`get_enabled_capabilities(enabled_plugin_ids)` 方法
- [x] 1.6 在 `backend/app/db/` 的初始化逻辑中新增 `plugin_user_settings` 表（`user_id TEXT, plugin_id TEXT, enabled INTEGER, PRIMARY KEY (user_id, plugin_id)`）
- [x] 1.7 在 `backend/app/main.py` lifespan 中调用 `PluginRegistry` 加载插件，挂载 `StaticFiles` 到 `/plugins/` 路由

## 2. 插件 API

- [x] 2.1 创建 `backend/app/routers/plugins.py`：实现 `GET /api/v1/plugins`，查询注册表 + 当前用户 `plugin_user_settings` 状态，返回插件列表
- [x] 2.2 实现 `POST /api/v1/plugins/{plugin_id}/toggle`：切换当前用户指定插件的启用/禁用状态，插件 ID 不存在时返回 404
- [x] 2.3 在 `backend/app/main.py` 中注册 plugins router（`prefix="/api/v1"`）

## 3. prompt_builder 集成

- [x] 3.1 修改 `backend/app/orchestrator/prompt_builder.py`：`build_system_prompt` 签名改为接受 `user_id: str`，内部从 `PluginRegistry` 查询用户已启用插件的 capabilities
- [x] 3.2 增强 `_build_plugin_section`：在能力表条目之外，为每个 capability 追加 `props_schema` 字段说明和 `a2ui_hint` 内容
- [x] 3.3 更新 chat router 中调用 `build_system_prompt` 的位置，传入 `user_id`（从请求上下文获取）

## 4. 前端动态加载

- [x] 4.1 重构 `frontend/src/a2ui-engine/CatalogRegistry.ts`：`setupDefaultCatalog` 改为 async，在初始化后调用 `GET /api/v1/plugins`，对 enabled 插件执行 dynamic import()
- [x] 4.2 从插件模块 default export 的 `components` 字段中提取各组件，按 `component_id` 注册到 `ComponentRegistry`
- [x] 4.3 处理插件加载失败的情况：单个插件加载失败时捕获异常、输出 ERROR 日志，不阻断其他插件加载和应用启动
- [x] 4.4 更新 `frontend/src/a2ui-engine/A2UISetup.tsx` 或初始化入口，适配 `setupDefaultCatalog` 变为 async

## 5. 插件管理 UI

- [x] 5.1 创建插件管理面板组件（modal 或内嵌面板），调用 `GET /api/v1/plugins` 展示插件卡片列表
- [x] 5.2 实现插件卡片：显示 `name`、`subject` 标签、capability 组件列表摘要、启用/禁用开关
- [x] 5.3 实现开关交互：点击调用 `POST /api/v1/plugins/{id}/toggle`，API 失败时恢复开关状态并显示错误提示
- [x] 5.4 实现空状态：无可用插件时显示提示文案
- [x] 5.5 在侧边栏底部添加插件管理入口按钮，点击展开面板
- [x] 5.6 样式检查：确保面板使用暖奶油背景、Manrope 字体、玻璃态卡片、无 1px 硬边框，与主页面风格一致

## 6. 首个示例插件（physics-high-school）

- [x] 6.1 创建 `plugins/physics-high-school/` 目录结构（`src/`、`knowledge/`、`dist/`）
- [x] 6.2 配置 `plugins/physics-high-school/vite.config.ts`：输出 ESM bundle，React/ReactDOM 作为 external
- [x] 6.3 实现 `PhysicsOscillator` React 组件（`src/PhysicsOscillator.tsx`）：Canvas 渲染简谐运动波形，接收 `amplitude`、`freq`、`phase` props
- [x] 6.4 实现 `src/index.ts`：default export `{ components: { PhysicsOscillator } }`
- [x] 6.5 编写 `manifest.json`：含 `entry.js`、`keywords`、`capabilities`（`component_id: PhysicsOscillator`、完整 `props_schema`、`a2ui_hint`、`expresses`、`educational_use`、`cannot_express`）
- [x] 6.6 执行 `npm run build` 生成 `dist/index.esm.js`
- [x] 6.7 在 Gallery 添加 `PhysicsOscillator` 示例（通过 `pluginGalleryRegistry.ts` 自动注册，含插件归属标签）

## 7. 开发者工具

- [x] 7.1 创建 `plugins/_template/` 脚手架：完整目录结构、预配置 `vite.config.ts`、`package.json`、`src/index.ts` 模板、空 `manifest.json` 模板
- [x] 7.2 编写 `plugins/_template/manifest-prompt.md`：AI Prompt 模板，含 A2UI 标准组件列表、props_schema 填写规范、a2ui_hint 写作指导、期望输出格式
- [x] 7.3 实现 `tools/build-knowledge.py`：CLI 工具，`--input <docs_dir> --output <output_path>`，将 `.md`/`.txt` 文档转换为向量数据库

## 8. 端到端验证

- [x] 8.1 启动前后端，确认 `GET /api/v1/plugins` 返回 `physics-high-school`
- [x] 8.2 通过插件管理 UI 启用 `physics-high-school`，确认前端动态加载并注册 `PhysicsOscillator`
- [x] 8.3 发起对话「展示振幅为 5 的简谐运动」，确认 LLM 输出包含 `PhysicsOscillator` 的 A2UI 消息且前端正确渲染
- [x] 8.4 Gallery 页面（`?gallery=1`）确认 `PhysicsOscillator` 示例正常显示
- [x] 8.5 更新 `design/architecture.md` 插件规范：新增 `entry.js` 字段说明，更新静态导入相关描述
