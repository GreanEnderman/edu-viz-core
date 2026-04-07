## ADDED Requirements

### Requirement: 插件脚手架模板
系统 SHALL 提供一个可复制的插件模板目录（`plugins/_template/`），包含：
- 标准目录结构（`src/`、`knowledge/`、`dist/`）
- 预配置的 `vite.config.ts`（ESM 输出、React/ReactDOM external）
- `package.json` 模板（含构建脚本）
- `src/index.ts` 导出模板（default export `{ components: {} }` 结构）
- 空的 `manifest.json` 模板（含所有必填字段占位）

#### Scenario: 复制模板创建新插件
- **WHEN** 开发者复制 `plugins/_template/` 目录并重命名
- **THEN** 执行 `npm install && npm run build` 后，`dist/index.esm.js` 产物结构与系统期望一致（空的 components export）

---

### Requirement: manifest AI Prompt 模板
系统 SHALL 在 `plugins/_template/manifest-prompt.md` 提供一个 Prompt 模板，供插件开发者将其连同组件源码喂给 AI，生成完整的 `manifest.json`。

Prompt 模板 SHALL 包含：
- A2UI 可用标准组件列表及说明
- manifest.json 所有字段的格式要求（含 `props_schema` 字段描述规范）
- `a2ui_hint` 的写作指导（如何描述「LLM 应如何用标准 A2UI 组件操控该插件组件」）
- `expresses`、`educational_use`、`cannot_express` 的填写说明
- 输出格式：完整的 `capabilities` 数组 JSON

#### Scenario: 使用 Prompt 模板生成 manifest
- **WHEN** 开发者将 `manifest-prompt.md` 内容 + 组件源码提供给 AI
- **THEN** AI 能输出包含 `component_id`、`props_schema`（含各字段 type/default/min/max）、`a2ui_hint`、`expresses`、`educational_use`、`cannot_express` 的完整 capabilities JSON

---

### Requirement: 知识库构建 CLI 工具
系统 SHALL 提供 CLI 脚本（`tools/build-knowledge.py`），用于将学科文档目录转换为向量数据库。

调用方式：`python tools/build-knowledge.py --input <docs_dir> --output <output_path>`

#### Scenario: 从文档目录构建知识库
- **WHEN** 执行 `python tools/build-knowledge.py --input ./docs --output ./knowledge/vector.db`，`docs/` 目录下存在 `.md` 或 `.txt` 文件
- **THEN** `knowledge/vector.db` 文件被创建，工具输出处理的文件数量和向量数

#### Scenario: 输入目录为空时提示错误
- **WHEN** 执行构建命令，`--input` 目录下无支持格式的文件
- **THEN** 工具输出错误提示并以非零退出码退出，不创建输出文件
