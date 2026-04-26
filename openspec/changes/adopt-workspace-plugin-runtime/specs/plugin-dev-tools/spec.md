## MODIFIED Requirements

### Requirement: 插件脚手架模板
系统 SHALL 提供一个可复制的插件模板目录（`plugins/_template/`），用于创建符合宿主共享运行时契约的插件。
模板 SHALL 包含：
- 标准目录结构（`src/`、`knowledge/`、`dist/`）
- 面向 `dist/index.esm.js` 输出的插件入口模板
- 面向 workspace 共享配置的构建约定
- manifest 模板，包含 `sharedDependencies` 占位说明
- AI 友好的开发说明与提示词模板
模板 MAY 保留少量插件局部配置文件，但 SHALL 避免要求每个插件重复维护完整且独立的 toolchain 配置。

#### Scenario: 复制模板创建新插件
- **WHEN** 开发者复制 `plugins/_template/` 目录并重命名
- **THEN** 生成的插件骨架符合共享运行时架构，并能够按系统要求产出 `dist/index.esm.js`

#### Scenario: 模板包含共享依赖声明指导
- **WHEN** 开发者查看模板中的 manifest 示例
- **THEN** 模板明确说明 `sharedDependencies` 用于声明宿主提供的共享运行时依赖

### Requirement: manifest AI Prompt 模板
系统 SHALL 在 `plugins/_template/manifest-prompt.md` 或等效的开发者指导中提供一个 Prompt 模板，供插件开发者将其连同组件源码提供给 AI，用于生成符合共享运行时架构的 `manifest.json`。
Prompt 模板 SHALL 包含：
- manifest.json 所有字段的格式要求
- `sharedDependencies` 的写法和使用边界
- `a2ui_hint` 的写作指导
- `expresses`、`educational_use`、`cannot_express` 的填写说明
- 对 AI 的明确约束：插件是宿主平台扩展，而不是独立前端项目

#### Scenario: 使用 Prompt 模板生成 manifest
- **WHEN** 开发者将 Prompt 模板内容与组件源码提供给 AI
- **THEN** AI 能输出包含 `sharedDependencies`、`component_id`、`props_schema`、`a2ui_hint`、`expresses`、`educational_use`、`cannot_express` 的完整 manifest 内容

#### Scenario: Prompt 模板限制不必要的独立依赖
- **WHEN** AI 根据模板生成插件开发建议
- **THEN** 模板引导 AI 优先复用宿主共享运行时和 workspace 共享工具，而不是默认为每个插件创建独立依赖栈
