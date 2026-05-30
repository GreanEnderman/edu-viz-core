# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

AhaTutor v2.0 是一个基于 A2UI (Agent-to-UI) 协议的项目驱动学习系统。目标不是传统“AI 家教”问答，而是围绕用户想完成的项目，拆解学习路径、评估掌握度、调用交互式可视化组件，并把学习结果回流到项目产物中。

当前代码库已包含 React 前端、FastAPI 后端、插件运行时、多个学科插件、Docker 部署配置和插件系统集成测试。不要再把项目视为“初始设置阶段”。

## 重要沟通规则

- 使用中文与用户对话。
- `AGENTS.md` 可以使用中文说明；命令、路径、包名、环境变量、API 名称和错误文本保持 English token 或中英双语。
- 不要创建不必要的文档。确有重要进展需要记录时，放在 `docs/` 下，内容聚焦问题分析、解决方案和经验总结。

## 仓库结构

```text
frontend/                 React 19 + TypeScript + Vite 前端
frontend/src/a2ui-engine/ A2UIProvider、SSE 流拆分、插件组件注册
frontend/src/components/  应用 UI、学习流、项目页、规划页、插件管理
frontend/src/gallery/     A2UI 组件预览库
backend/                  FastAPI 后端
backend/app/routers/      API 路由，如 chat、plugins、pbl、conversations
backend/app/agents/       学习目标、课程、掌握度、导师、可视化等智能体模块
backend/app/learning/     学习路径、测评、会话服务
backend/app/orchestrator/ A2UI 消息和 Prompt 组装
backend/app/workflow/     PBL / tutor workflow 编排
plugins/                  学科插件工作区与打包产物
packages/plugin-runtime/  插件运行时共享包
design/                   架构和开发计划
docs/                     必要项目文档
data/                     本地数据库 / 知识数据
vendor/A2UI-main/         vendored A2UI upstream，不做随意重构
docker/                   Docker / nginx 辅助配置
```

只在当前任务需要时进入 `frontend-v1/`、`vendor/`、`.omx/`、`.codex/`、`.agents/`。`vendor/A2UI-main/` 下有自己的 guidance 文件，修改 vendored 代码前先读取更深层规则。

## 开发命令

根目录是 npm workspace：

```bash
npm install
npm run dev:v2
npm run build:plugins
npm run typecheck:plugins
```

前端：

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

后端：

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Docker：

```bash
docker compose up --build
```

插件系统集成测试依赖已运行的后端服务，测试脚本位于根目录：

```bash
python test_plugin_system.py
```

`test_plugin_system.sh` 是同一插件系统验证流程的 shell 版本。

## 环境变量与密钥

- 根目录 `.env.example` 记录 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`、`ALLOWED_ORIGINS`、`PORT`。
- `backend/app/.env.example` 提供后端本地运行示例。
- 不要提交真实 API key、token、cookie 或私有连接串。仓库内已有 `.env` 仅作为本机状态处理，不要把其中的值复制进代码、文档或提交说明。
- Docker 默认读取根目录 `.env`，并将 `DATABASE_PATH` 设置到容器内 `/app/data/aha_tutor.db`。

## 架构约定

- 前端使用 React 19、TypeScript、Vite、Tailwind CSS v4、Zustand、Three.js、`@a2ui/react`。
- 后端使用 FastAPI、Pydantic settings、OpenAI-compatible LLM API、SQLite / local data、SSE streaming。
- A2UI 消息由后端生成或编排，经 SSE 流传给前端，前端通过 `A2UIRenderer` 和插件注册表真实渲染。
- 插件必须通过 manifest / registry 路径接入，不要绕过 `plugins_manager`、`CatalogRegistry` 或现有插件运行时机制。
- 保持模块低耦合、高内聚。优先复用现有 service、hook、store、schema 和 registry 模式，再考虑新增抽象。

## 前端设计规范

详见 [temp/原型/DESIGN.md](temp/原型/DESIGN.md)。核心方向是 **The Illuminated Mind**：高端编辑排版、充足留白、非对称布局、玻璃态分层，避免传统 EdTech 仪表盘感。

必须遵守：

- 底色 `surface` `#faf9f5`，主色 `primary` `#182544`，强调色 `secondary` `#775a19`。
- 禁用纯黑 `#000000`，正文使用 `on-surface` `#1b1c1a`。
- 不用 `1px solid` 边框分割主要区域；优先用背景色阶、色调分块和负空间。
- 对话内容和 A2UI 学习组件优先使用 Newsreader；界面控件使用 Manrope。
- 金色只用于提示、深挖、顿悟或学习结论等关键瞬间。
- 组件距视口边缘至少保留 `2rem` 内边距，除非已有布局系统明确处理。

Gallery 访问入口：

```text
http://localhost:5173/?gallery=1
```

如果 Vite 自动选择了其他端口，以终端输出为准。Gallery 位于 `frontend/src/gallery/`，通过 `A2UIRenderer` 真实渲染组件，与聊天 / 学习页面共享渲染管线。

新增或调整 A2UI 组件样式时：

- 在 `frontend/src/gallery/componentExamples.ts` 或相关 gallery registry 中补充预览数据。
- 样式覆盖必须写在全局 CSS，如 `frontend/src/index.css`，确保主页面和 Gallery 一致。
- 不要把 A2UI 样式覆盖写到组件局部 `<style>` 或 CSS Modules 中，除非该组件有明确的封装边界并同步验证 Gallery。

## 插件约定

- 插件位于 `plugins/`，当前包含 physics、chemistry、genetics、projectile-motion 等插件目录和 zip 打包产物。
- root `package.json` 的 `build:plugins` 和 `typecheck:plugins` 只覆盖脚本中列出的 workspace；新增插件后同步更新 workspace、脚本和 Gallery 示例。
- 插件能力需要同时考虑后端 manifest/API、前端组件注册、A2UI schema、Gallery 示例和集成测试。

## 测试与验证

根据改动范围选择验证：

- 前端 UI / TS 改动：运行 `cd frontend && npm run lint`，必要时运行 `npm run build`，并用浏览器检查主页面或 Gallery。
- 插件改动：运行根目录 `npm run build:plugins` 和 / 或 `npm run typecheck:plugins`；涉及运行时渲染时检查 Gallery。
- 后端 API / workflow 改动：运行后端服务并执行相关 HTTP 手动验证；插件系统改动运行 `python test_plugin_system.py`。
- Docker / 部署改动：运行 `docker compose up --build` 或至少说明未运行的原因。

完成任务前报告实际运行过的命令和结果；如果某项未运行，说明原因和剩余风险。

## 代码与文件卫生

- 不要提交或依赖 `__pycache__/`、`.pytest_cache/`、`node_modules/`、临时 zip/tar 包、pytest 临时目录等生成物。
- 不要随意修改 `vendor/A2UI-main/`，除非任务明确需要或上游 vendored 代码确为问题根源。
- 对 cleanup/refactor/deslop 工作，先写清理计划；行为未被测试保护时先补回归测试，再做小步可回退修改。
- 保持 diff 小而可审查。优先删除过时代码和复用现有模式，不新增依赖，除非用户明确要求。
- 修改共享 schema、A2UI 消息格式、插件 manifest、SSE 协议或 API response shape 时，同时检查前后端调用点和 Gallery / 测试覆盖。

## Git 提交说明

如果用户要求提交，commit message 遵守 Lore Commit Protocol：第一行写“为什么改”，正文记录约束、取舍、风险和验证，使用 git trailer 格式，例如 `Constraint:`、`Rejected:`、`Confidence:`、`Scope-risk:`、`Tested:`、`Not-tested:`。
