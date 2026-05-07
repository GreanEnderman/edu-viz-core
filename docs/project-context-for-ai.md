# AhaTutor v2.0 项目全景上下文

> 目标读者：任何第一次接手本项目的 AI 或开发者。  
> 阅读目的：不用额外询问背景，也能理解 AhaTutor 的产品愿景、当前代码状态、核心架构、已实现能力、规划方向和下一步开发入口。  
> 依据来源：`README.md`、`docs/PBL-plan.md`、`design/architecture.md`、`design/development-plan.md`，以及当前 `frontend/`、`backend/`、`plugins/` 代码。

---

## 1. 一句话理解项目

AhaTutor v2.0 是一个基于 A2UI 协议的项目驱动智能学习系统：用户不是来“上课”，而是带着一个想完成的项目来；系统把目标拆成学习路径树，判断用户掌握度，用交互式可视化组件教学，并把每个知识点回收成项目产物能力。

更直白地说：它想从“会讲解的 AI 聊天工具”进化为“围绕项目目标组织学习、测评、可视化演示和创作推进的学习操作系统”。

---

## 2. 产品愿景

传统 AI Tutor 的交互通常是：

- 用户问：“教我物理。”
- AI 输出一段解释、例题或课程目录。

AhaTutor 期望的交互是：

- 用户说：“我想做一个弹簧振子模拟器。”
- 系统识别这是一个项目目标，而不是单一知识点。
- 系统生成目标树：简谐运动、胡克定律、周期、状态更新、动画循环、交互控件、曲线可视化等。
- 系统逐个判断节点掌握度：会、忘了、不确定、不会。
- 系统在需要时调用 A2UI 组件，例如弹簧振子、抛体运动、3D 分子模型、基因热图。
- 用户完成子节点后，系统回溯到父节点，解释“这个知识如何服务于你的项目”。
- 最终用户不只是“听懂了”，而是能完成真实作品。

项目的核心价值主张是：学习不以课程目录为中心，而以用户想完成的项目为中心；知识不是孤立讲解，而是被组织进创造过程。

---

## 3. PBL 方向总结

`docs/PBL-plan.md` 是当前最重要的产品方向文档。它定义了 AhaTutor 下一阶段从“对话 + 组件展示”升级为 “Project-Based Learning Agent System” 的路线。

### 3.1 核心模块

PBL 方案建议系统由以下模块组成：

| 模块 | 职责 | 当前状态 |
| --- | --- | --- |
| Goal Intake 目标理解 | 把用户自然语言愿望转成结构化项目目标 | 规划中 |
| Knowledge Tree 目标树生成 | 将项目目标拆成学习节点树 | 规划中 |
| Mastery Assessment 掌握度判断 | 让用户选择“会/忘了/不确定/不会”，并生成测评 | 规划中 |
| Learning Session 学习会话 | 围绕当前节点教学，而不是泛泛聊天 | 部分具备基础聊天能力 |
| A2UI Component Planning | 决定何时调用哪个可视化组件 | 已有提示词规则和插件能力注入，仍需更强编排 |
| Backtracking 回溯整合 | 子节点完成后回到父节点和根项目 | 规划中 |
| Project Builder 项目推进 | 把学习节点映射为实际项目里程碑 | 规划中 |

### 3.2 建议的核心智能体

第一阶段建议先做 8 个智能体或等价服务模块：

| 智能体 | 职责 |
| --- | --- |
| `LearningOrchestratorAgent` | 总控，维护学习状态，决定下一步 |
| `GoalClarifierAgent` | 理解用户目标和约束 |
| `CurriculumArchitectAgent` | 生成学习树 |
| `AssessmentDesignerAgent` | 为节点生成测评 |
| `MasteryJudgeAgent` | 判断用户是否掌握 |
| `TutorAgent` | 正式教学 |
| `VisualizerAgent` | 决定何时调用 A2UI 组件 |
| `IntegrationAgent` | 子节点回溯到父节点，连接项目目标 |

第二阶段再加入误区识别、项目规划、代码辅助、反思总结、长期记忆等能力。

### 3.3 最小闭环 MVP

PBL 文档建议下一步最小闭环是：

1. 用户输入一个项目目标。
2. 后端生成 2-3 层学习树。
3. 前端展示树结构。
4. 用户点击节点。
5. 系统询问“会 / 不确定 / 不会”。
6. 不确定时生成 3 道测评。
7. 不会时进入教学。
8. 教学过程中调用 A2UI 组件。
9. 学完后标记节点完成。
10. 子节点完成后回溯到父节点。
11. 最终生成“我现在已经能完成这个项目的哪些部分”。

---

## 4. 当前真实实现状态

当前代码已经实现的是“A2UI 驱动的流式聊天 + 插件组件系统 + 会话持久化 + Gallery 预览”。PBL 学习树和多智能体编排还没有落地。

### 4.1 已实现

- FastAPI 后端服务，入口为 `backend/app/main.py`。
- React 19 + TypeScript + Vite 前端，入口为 `frontend/src/App.tsx`。
- OpenAI 兼容 Chat Completions 流式调用，见 `backend/app/services/llm.py`。
- SSE 聊天接口 `POST /api/v1/chat`，见 `backend/app/routers/chat.py`。
- SSE 事件类型包括 `text`、`a2ui`、`title`、`done`、`error`。
- A2UI v0.8 JSONL 消息识别、封装和前端分流。
- 前端通过 `@a2ui/react` 渲染标准组件和插件组件。
- 插件 manifest 扫描、注册、启用/禁用。
- 插件前端 bundle 动态加载。
- 部分插件后端 `invoke` 机制。
- SQLite 会话持久化：`conversations`、`messages`、`plugin_user_settings`。
- 左侧会话列表、右侧插件面板、顶部导航、聊天输入。
- Markdown、数学公式 KaTeX、Mermaid 图表渲染。
- `http://localhost:5173/?gallery=1` 组件预览库。

### 4.2 尚未真正实现或仍是规划

- PBL 目标理解模块。
- 学习路径树数据模型和生成器。
- 节点掌握度测评。
- 多智能体后端编排。
- RAG 检索链路。
- 意图路由器文件。
- 学习画像和跨会话学习状态。
- 项目里程碑和产物推进。

注意：`README.md` 中写到 “RAG 检索与意图路由” 已完成，但当前代码里没有 `backend/app/orchestrator/retriever.py` 或 `intent_router.py`。实际代码目前是把已启用插件的 capabilities 注入 system prompt，让 LLM 自己决定是否生成对应 A2UI 组件。

---

## 5. 技术栈

### 5.1 前端

- React 19
- TypeScript
- Vite
- `@a2ui/react`，本地依赖路径为 `vendor/A2UI-main/renderers/react`
- Zustand
- Tailwind CSS 4
- React Markdown
- KaTeX
- Mermaid
- Three.js

关键 package 文件：

- 根工作区：`package.json`
- 前端：`frontend/package.json`
- 插件工作区：`plugins/*/package.json`

### 5.2 后端

- FastAPI
- Uvicorn
- OpenAI Python SDK
- Pydantic Settings
- SQLite + aiosqlite

关键文件：

- `backend/requirements.txt`
- `backend/app/core/config.py`
- `backend/app/main.py`

---

## 6. 代码结构导览

### 6.1 后端

```txt
backend/app/
├── main.py                     # FastAPI 应用入口；初始化 DB、加载插件、挂载路由和静态插件目录
├── db.py                       # SQLite 初始化与连接管理
├── core/config.py              # 环境变量配置
├── routers/
│   ├── chat.py                 # POST /api/v1/chat；SSE 流式聊天
│   ├── conversations.py        # 会话 CRUD 和消息读取
│   └── plugins.py              # 插件列表、开关、后端 invoke
├── services/
│   └── llm.py                  # OpenAI 兼容流式调用和标题生成
├── orchestrator/
│   ├── prompt_builder.py       # 构建 system prompt，注入 A2UI 规则和插件能力
│   └── a2ui_builder.py         # A2UI v0.8 消息构造、检测、SSE 包装
├── plugins_manager/
│   ├── loader.py               # 扫描 plugins/ 下 manifest.json
│   └── registry.py             # 内存插件注册表
└── models/
    ├── a2ui_schema.py
    ├── conversation.py
    └── plugin.py
```

### 6.2 前端

```txt
frontend/src/
├── App.tsx                         # 主应用；普通聊天模式和 Gallery 模式切换
├── main.tsx
├── index.css                       # 全局设计系统和 A2UI 样式覆盖
├── a2ui-engine/
│   ├── A2UISetup.tsx               # A2UIProvider，初始化默认 catalog 和插件组件
│   ├── CatalogRegistry.ts          # 动态加载插件 bundle，注册到 ComponentRegistry
│   └── StreamSplitter.ts           # 解析 SSE、识别 A2UI、surfaceId 重写
├── components/
│   ├── Chat/                       # MessageList、TextBubble、A2UISurface、ChatInput
│   ├── Layout/                     # LeftSidebar、RightSidebar、TopNav
│   └── Plugins/PluginsPanel.tsx    # 插件启用/禁用面板
├── gallery/                        # A2UI 组件预览库
├── hooks/useChat.ts                # 聊天发送、流式处理、A2UI processMessages
├── services/                       # HTTP、聊天、会话、插件 API 封装
├── store/chatStore.ts              # Zustand 会话和流式消息状态
└── types/                          # chat/plugin 类型定义
```

### 6.3 插件

```txt
plugins/
├── physics-high-school/            # 简谐运动 PhysicsOscillator
├── projectile-motion/              # 抛体运动 ProjectileMotion
├── chemistry-molecule-3d/          # 3D 分子 MoleculeDisplay，带 Python 后端
├── chemistry-orbital-3d/           # 原子轨道 OrbitalViewer
├── genetics-dna/                   # DNA 结构
├── genetics-heatmap/               # 基因表达热图
├── genetics-naturalselection/      # 自然选择模拟器
├── genetics-punnett/               # 孟德尔方格图
├── genetics-volcano/               # 火山图
├── test-invoke/                    # 插件 invoke 测试
└── _template/                      # 插件模板
```

插件通常包含：

- `manifest.json`
- `src/`
- `dist/index.esm.js`
- 可选 `backend/`
- 可选 `knowledge/`

---

## 7. 核心运行流程

### 7.1 启动流程

后端启动：

1. `backend/app/main.py` 创建 FastAPI app。
2. lifespan 中调用 `init_db()` 初始化 SQLite。
3. 调用 `load_plugins(settings.PLUGINS_DIR)` 扫描 `plugins/`。
4. 将插件加载进 `PluginRegistry`。
5. 挂载 `/plugins` 静态目录，使前端可以获取插件 ESM bundle。
6. 注册 chat、conversations、plugins 路由。

前端启动：

1. `frontend/src/main.tsx` 渲染 `App`。
2. `App` 外层包裹 `A2UISetup`。
3. `A2UISetup` 调用 `setupDefaultCatalog()` 注册 A2UI 默认组件。
4. 非 mock 模式下调用 `loadPluginComponents()`。
5. `loadPluginComponents()` 请求 `/api/v1/plugins`，筛选 enabled 插件。
6. 前端 fetch 插件 `dist/index.esm.js`，重写 React、ReactDOM、`@a2ui/react` 共享运行时 import。
7. 将插件组件注册进 A2UI `ComponentRegistry`。

### 7.2 聊天与 A2UI 渲染流程

1. 用户在 `ChatInput` 输入消息。
2. `useChat.handleSend()` 调用 `chatStore.sendMessage()`，必要时先创建 conversation。
3. 前端 `streamChat()` POST 到 `/api/v1/chat`。
4. 后端 `chat.py`：
   - 读取会话消息。
   - 获取默认用户启用的插件 capabilities。
   - `build_system_prompt()` 注入 A2UI 输出规则、Mermaid 规则、组件能力表和插件能力表。
   - 调用 `stream_chat()` 流式请求 LLM。
5. LLM 输出普通文本或 A2UI JSONL。
6. 后端逐行判断：
   - A2UI 行：包装成 `data: {"type":"a2ui","line":"..."}`
   - 文本行：包装成 `data: {"type":"text","content":"..."}`
7. 前端 `splitSSELine()` 分流。
8. 文本进入 `appendChunk()`，由 `TextBubble` 流式渲染。
9. A2UI 行进入 `onA2UILine()`：
   - 给本轮 A2UI 分配独立 `surfaceId`，避免覆盖已有组件。
   - `remapSurfaceId()` 把 `"main"` 替换成消息级 surfaceId。
   - `processMessages()` 交给 `@a2ui/react` 渲染。
10. 会话结束后，后端持久化 user 和 assistant 消息；首次回复后生成会话标题。

### 7.3 历史会话恢复

1. 前端切换会话时调用 `/api/v1/conversations/{id}/messages`。
2. `buildConversationMessages()` 将 assistant 历史内容按 A2UI JSONL 和文本拆成有序段落。
3. 每个 A2UI 段落重新分配 surfaceId。
4. `useChat` 的 effect 会对历史 A2UI messages 调用 `processMessages()`，恢复组件展示。

---

## 8. A2UI 协议约定

项目使用 A2UI v0.8。

A2UI 消息是 JSONL，每行一个完整 JSON 对象。当前识别的顶层 key：

- `surfaceUpdate`
- `dataModelUpdate`
- `beginRendering`
- `deleteSurface`

典型顺序：

```jsonl
{"surfaceUpdate":{"surfaceId":"main","components":[...]}}
{"dataModelUpdate":{"surfaceId":"main","contents":[...]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
```

在 SSE 中会被后端包装成：

```txt
data: {"type":"a2ui","line":"{\"surfaceUpdate\":{...}}"}
```

普通文本则是：

```txt
data: {"type":"text","content":"..."}
```

前端不直接猜测 SSE 内容，而是先读 `type` 字段；历史消息恢复时才用 `isA2UILine()` 判断文本中的 A2UI JSONL。

---

## 9. 插件系统

### 9.1 manifest 核心字段

每个插件至少需要：

```json
{
  "id": "physics-high-school",
  "version": "1.0.0",
  "subject": "physics",
  "name": "高中物理插件",
  "keywords": ["振动", "简谐运动"],
  "entry": {
    "js": "dist/index.esm.js"
  },
  "sharedDependencies": ["react", "react-dom", "@a2ui/react"],
  "capabilities": [
    {
      "component_id": "PhysicsOscillator",
      "name": "简谐运动模拟器",
      "tags": ["振动"],
      "props_schema": {},
      "a2ui_hint": "告诉 LLM 如何使用该组件",
      "expresses": [],
      "educational_use": "",
      "cannot_express": []
    }
  ]
}
```

可选：

- `entry.python_module`：用于后端插件 invoke。
- `entry.vector_db`：规划中的知识库入口，目前未接入检索。

### 9.2 当前插件清单

| 插件 ID | 名称 | 学科 | 组件 |
| --- | --- | --- | --- |
| `physics-high-school` | 高中物理插件 | physics | `PhysicsOscillator` |
| `projectile-motion` | 抛体运动模拟器 | physics | `ProjectileMotion` |
| `chemistry-molecule-3d` | 3D 分子可视化插件 | chemistry | `MoleculeDisplay` |
| `chemistry-orbital-3d` | 原子轨道 3D 可视化插件 | chemistry | `OrbitalViewer` |
| `genetics-dna` | DNA 结构可视化插件 | genetics | `DNAStructure` |
| `genetics-heatmap` | 基因表达热图插件 | genetics | `GeneExpressionHeatmap` |
| `genetics-naturalselection` | 自然选择模拟器插件 | genetics | `NaturalSelectionSimulator` |
| `genetics-punnett` | 孟德尔方格图插件 | genetics | `PunnettSquare` |
| `genetics-volcano` | 火山图插件 | genetics | `VolcanoPlot` |
| `test-invoke` | 测试 Invoke 插件 | test | 无前端组件，测试后端 invoke |

### 9.3 插件启用逻辑

- 后端 `/api/v1/plugins` 返回所有插件和 enabled 状态。
- `/api/v1/plugins/{plugin_id}/toggle` 切换默认用户 `default` 的启用状态。
- enabled 状态存在 SQLite `plugin_user_settings` 表。
- 只有 enabled 插件的 capabilities 会进入 system prompt。
- 前端也只加载 enabled 插件的 bundle。

### 9.4 插件后端 invoke

`backend/app/routers/plugins.py` 提供：

```txt
POST /api/v1/plugins/{plugin_id}/invoke
```

请求：

```json
{
  "action": "parse_structure",
  "payload": {}
}
```

如果插件 manifest 中有 `entry.python_module`，后端会动态导入该模块并调用其 `invoke(action, payload, context)`。

当前 `chemistry-molecule-3d` 有 Python 后端模块，用于分子结构解析等能力。

---

## 10. 数据库

SQLite 数据库路径由 `settings.DATABASE_PATH` 控制。仓库中已有 `data/aha_tutor.db`。

当前表：

### `conversations`

- `id`
- `title`
- `created_at`
- `updated_at`

### `messages`

- `id`
- `conversation_id`
- `role`
- `type`
- `content`
- `created_at`

当前 assistant 的完整原始输出会作为 text 内容保存，里面可能混有 A2UI JSONL 行。前端恢复时再拆分。

### `plugin_user_settings`

- `user_id`
- `plugin_id`
- `enabled`

当前系统按单用户处理，固定 user_id 为 `default`。

---

## 11. 设计语言

项目的前端设计方向是 “The Illuminated Mind”：

- 拒绝传统 EdTech 仪表盘美学。
- 采用高端编辑排版风格。
- 大量留白、非对称布局、玻璃态分层。
- 目标是“阳光图书馆”式沉浸学习空间。
- UI 应该尽量消失，只留下知识的清晰呈现。

关键视觉约束来自 `AGENTS.md` 和 `temp/原型/DESIGN.md`：

- 底色：`#faf9f5`
- 主色：`#182544`
- 强调色：`#775a19`
- 禁止纯黑。
- 尽量不用 1px 实线分割，改用背景色阶、负空间和轻透明 outline。
- 对话内容使用 Newsreader/Noto Serif SC 类衬线字体。
- UI 控件使用 Manrope 类无衬线字体。
- A2UI 组件样式覆盖应写在全局 `index.css`，保证聊天页面和 Gallery 一致。

---

## 12. 开发与运行命令

### 12.1 前端

```bash
cd frontend
npm install
npm run dev
```

主界面：

```txt
http://localhost:5173
```

Gallery：

```txt
http://localhost:5173/?gallery=1
```

构建：

```bash
cd frontend
npm run build
```

### 12.2 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API 文档：

```txt
http://localhost:8000/docs
```

注意：部分代码 import 使用 `backend.app...`，从项目根目录启动时更稳：

```bash
uvicorn backend.app.main:app --reload
```

### 12.3 插件

根目录 package scripts 当前包含：

```bash
npm run build:plugins
npm run typecheck:plugins
```

但脚本只覆盖 `_template`、`chemistry-molecule-3d`、`chemistry-orbital-3d`、`physics-high-school`，没有覆盖所有插件。新增插件时要检查根 `package.json` 的 workspace scripts 是否需要更新。

---

## 13. 测试与验证

当前仓库里有一个后端测试脚本：

```txt
backend/tests/test_visualization_decision.py
```

它会调用真实 LLM，测试不同问题是否选择纯文本、Mermaid 或 A2UI。运行方式：

```bash
python backend/tests/test_visualization_decision.py
```

这个脚本依赖 LLM 配置，不是纯单元测试。

更常用的手工验证路径：

1. 启动后端。
2. 启动前端。
3. 打开插件面板，启用相关插件。
4. 提问“展示振幅为 5 的简谐运动”或“展示抛体运动轨迹”。
5. 检查是否出现 A2UI 组件。
6. 打开 `?gallery=1` 检查组件预览。

---

## 14. 当前代码与文档的差异

接手项目时要特别注意“愿景文档”和“真实代码状态”之间的差异。

### 14.1 README 偏愿景化

`README.md` 说当前已完成：

- RAG 检索与意图路由。
- 用户交互回传与教学闭环。

真实代码状态：

- 没有发现 `retriever.py` 和 `intent_router.py`。
- 当前 LLM 是否调用组件主要靠 system prompt 中的可视化决策规则和 enabled 插件能力表。
- A2UI Provider 已接入，但当前主聊天链路没有看到完整的 A2UI `onAction` 回传到聊天接口的实现；插件自身可能有内置交互，但“用户操作组件 → AI 感知并回复”的闭环还需继续确认或补齐。

### 14.2 架构文档中的部分文件名已变化

`design/architecture.md` 描述了早期结构，例如 `api/v1/`、`a2ui-engine/A2UISetup.tsx`、`CatalogRegistry.ts` 等。当前后端实际路由目录是 `backend/app/routers/`，不是 `api/v1/` 文件夹；FastAPI 通过 prefix 暴露 `/api/v1/...`。

### 14.3 插件加载方案已经比旧文档更动态

架构文档一处写插件组件静态导入，当前代码实际是：

- 后端挂载 `/plugins` 静态目录。
- 前端 fetch 插件 ESM bundle。
- 重写共享依赖 import。
- 动态 import blob URL。
- 注册组件。

这是更接近插件化运行时的方案。

---

## 15. 下一步开发建议

如果目标是继续 PBL 方向，建议不要先大规模重构 UI，而是先补“学习状态核心”。

### 15.1 后端建议新增

```txt
backend/app/learning/
├── schemas.py             # ProjectGoal、LearningNode、LearningWorkflowState、MasteryResult
├── goal_intake.py         # 目标结构化
├── knowledge_tree.py      # 学习树生成
├── mastery.py             # 掌握度判断和测评
└── project_bridge.py      # 学习节点到项目产物映射

backend/app/workflow/
├── state.py               # 工作流状态持久化
├── transitions.py         # planning/assessment/learning/review/building 状态流转
└── node_runner.py         # 当前节点执行
```

### 15.2 前端建议新增

```txt
frontend/src/learning/
├── KnowledgeTreeView.tsx
├── NodeStatusPanel.tsx
├── MasteryCheck.tsx
├── LearningPathHeader.tsx
└── ProjectProgress.tsx
```

### 15.3 数据模型建议

从 `docs/PBL-plan.md` 可以直接落地这些类型：

```ts
type LearningNode = {
  id: string;
  title: string;
  description: string;
  parentId?: string;
  children: string[];
  prerequisites: string[];
  masteryCriteria: string[];
  estimatedDifficulty: "easy" | "medium" | "hard";
  status: "unknown" | "skipped" | "review" | "learning" | "mastered";
  componentHints: string[];
};
```

```ts
type LearningWorkflowState = {
  userGoal: ProjectGoal;
  knowledgeTree: LearningNode[];
  currentNodeId: string;
  masteredNodeIds: string[];
  skippedNodeIds: string[];
  weakNodeIds: string[];
  currentMode: "planning" | "assessment" | "learning" | "review" | "building";
  projectProgress: ProjectMilestone[];
};
```

### 15.4 推荐迭代顺序

1. 定义 PBL 数据模型和 API 契约。
2. 做一个最小目标树生成接口，先允许 mock 或 LLM 生成。
3. 前端显示学习树，不要一开始做复杂 IDE。
4. 做节点掌握度选择：会 / 不确定 / 不会。
5. 把“不会”接到现有聊天教学链路。
6. 把“需要可视化”的节点接到现有 A2UI 插件能力。
7. 做节点完成和父节点回溯。
8. 再考虑长期学习画像、RAG、项目里程碑。

---

## 16. 给后续 AI 的工作提醒

1. 先区分“愿景”与“已实现”。PBL 文档是方向，不是现状。
2. 不要把 README 中的 RAG 已完成当成事实；先检查代码。
3. A2UI 当前使用 v0.8，消息类型是顶层 key，不是 `type` 字段。
4. SSE 外层有 `type` 字段，A2UI JSONL 内层没有 `type` 字段。
5. 插件组件很多已内置控件，生成 A2UI 时通常只需要传初始 props，不要再包一层 Slider/Button。
6. 新增 A2UI 组件样式覆盖应放在 `frontend/src/index.css`，保证聊天和 Gallery 一致。
7. 插件加载依赖共享运行时重写，改 `CatalogRegistry.ts` 时要非常小心。
8. 当前系统固定单用户 `default`，如果要做多用户，需要改插件开关、会话归属和学习状态表。
9. 当前 assistant 历史消息以混合文本存储，A2UI 恢复靠前端解析；改存储结构前要考虑历史兼容。
10. PBL 的最佳切入点是新增学习工作流，不是替换现有聊天链路；现有聊天链路可以作为 Learning Session 的执行器。

---

## 17. 项目本质

AhaTutor 的本质不是“聊天中插入几个炫酷组件”。组件只是手段。

真正要做的是一个闭环：

```txt
项目目标
→ 知识拆解
→ 掌握度判断
→ 可视化教学
→ 练习与反馈
→ 子知识回溯整合
→ 项目产物推进
→ 能力地图沉淀
```

当前代码已经打通了“聊天 + A2UI + 插件 + Gallery”的技术底座。下一阶段的关键，是在这条底座上增加“学习目标树”和“项目推进状态”，让系统从能解释知识，变成能组织学习过程。
