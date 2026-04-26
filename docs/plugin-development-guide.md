# AhaTutor 插件开发指南
> 这份文档面向 AhaTutor 插件开发者。
>
> 它的目标不是教你“再造一个独立前后端项目”，而是教你如何在 AhaTutor 既有平台里新增一个可被 AI 调用的学科能力。
>
> 当前推荐的插件策略只有一句话：
> **宿主负责平台、运行时与编排；插件负责学科能力、组件表现，以及必要时的专属后端计算。**
>
> 本文档特别适合配合 AI 编程工具使用。你可以直接把文中的提示词模板发给 Codex、Claude、GPT、DeepSeek 等模型，让它们帮助你生成组件、`manifest.json`、插件后端模块和调试方案。

---

## 目录

1. [先理解新的插件模型](#1-先理解新的插件模型)
2. [什么时候需要插件专属后端](#2-什么时候需要插件专属后端)
3. [插件开发者真正需要负责什么](#3-插件开发者真正需要负责什么)
4. [目录结构](#4-目录结构)
5. [开发流程总览](#5-开发流程总览)
6. [Step 1：定义插件边界](#6-step-1定义插件边界)
7. [Step 2：编写前端组件](#7-step-2编写前端组件)
8. [Step 3：编写插件后端模块](#8-step-3编写插件后端模块)
9. [Step 4：编写入口文件](#9-step-4编写入口文件)
10. [Step 5：编写 manifest.json](#10-step-5编写-manifestjson)
11. [Step 6：构建与验证](#11-step-6构建与验证)
12. [依赖与体积控制规则](#12-依赖与体积控制规则)
13. [给 AI 工具的开发模板](#13-给-ai-工具的开发模板)
14. [从现有代码改造成插件](#14-从现有代码改造成插件)
15. [验收清单](#15-验收清单)
16. [常见问题](#16-常见问题)

---

## 1. 先理解新的插件模型

旧思路里，每个插件都像一个独立小项目：

- 自己维护一套 `package.json`
- 自己安装一套 `node_modules`
- 自己维护一套前端构建链
- 如果功能复杂，还想自己长一套后端服务

这种方式短期上手快，但一旦插件增多，问题会很明显：

- 依赖重复，仓库越来越重
- React、Vite、构建配置容易漂移
- 调试链路分裂，平台与插件互相推责任
- 插件一多，最后像在维护很多个小应用

新的插件模型不是这样。当前推荐模型是：

### 宿主负责

- React / A2UI / 平台运行时
- FastAPI / 会话 / SSE / 鉴权 / 插件加载
- 插件清单读取与能力编排
- 前后端通信协议

### 插件负责

- 学科专属的前端组件
- 供 LLM 使用的能力描述
- 可选的知识库
- 必要时的“宿主托管型插件专属后端模块”

一句话理解：

1. 插件可以有前端组件
2. 插件可以有知识库
3. 插件也可以有专属 Python 计算逻辑
4. 但插件**不是**独立应用，也**不是**独立后端系统

最重要的边界是：

- **允许插件拥有专属后端能力**
- **不推荐插件拥有独立后端产品面**

也就是：

- 推荐：插件提供一个 Python 模块，由宿主按约定调用
- 不推荐：插件自己起一套 FastAPI、自己管路由、自己管会话、自己管部署

---

## 2. 什么时候需要插件专属后端

不是每个插件都需要后端。

很多插件只靠前端就够了，例如：

- 纯 Canvas / SVG 可视化
- 简单参数驱动的几何图形
- 纯前端动画或状态切换

但有些插件天然需要 Python 参与，这完全合理。例如：

- 分子结构生成或解析
- 原子轨道数据采样
- 符号计算
- 几何求解
- 调用科学计算库
- 对专有文件格式做解析或转换

这种情况下，推荐方案不是“让插件自己拥有独立后端服务”，而是：

**让插件提供一个宿主托管的后端模块。**

推荐心智模型：

- 宿主负责 HTTP 和平台生命周期
- 插件后端只负责领域计算
- 宿主通过统一接口调用插件后端

### 推荐的判断标准

如果一个能力满足下面任意两条，就可以考虑插件专属后端：

- 纯前端实现成本过高
- 必须依赖成熟 Python 库
- 计算逻辑明显是学科专属的
- 它不适合提炼成宿主的通用平台能力
- 结果最好由宿主统一注入聊天/A2UI 链路

### 不推荐直接做独立插件后端服务的原因

- 路由、鉴权、会话管理会分裂
- 部署复杂度会显著上升
- 日志与错误处理更难统一
- 插件越多，越像在维护很多小微服务
- 以后做权限和资源隔离会非常麻烦

---

## 3. 插件开发者真正需要负责什么

插件开发者需要负责：

- 定义插件能力边界
- 编写可视化或交互组件
- 设计给 LLM 使用的参数接口
- 必要时编写插件专属 Python 模块
- 编写 `manifest.json`
- 保证插件符合 AhaTutor 的设计语言和平台约束

插件开发者通常**不需要**负责：

- 自己再维护一套 React 运行时
- 自己再维护一套 A2UI 运行时
- 自己再起一个完整后端应用
- 自己设计一套独立聊天协议
- 自己实现平台级会话、鉴权、SSE

一句话：
**插件写的是“学科能力”，不是“平台基础设施”。**

---

## 4. 目录结构

### 4.1 纯前端插件

```text
plugins/<plugin-id>/
├── manifest.json
├── src/
│   ├── index.ts
│   └── MyComponent.tsx
├── dist/
│   └── index.esm.js
└── knowledge/
    └── vector.db
```

### 4.2 带宿主托管后端的插件

```text
plugins/<plugin-id>/
├── manifest.json
├── src/
│   ├── index.ts
│   └── MoleculeViewer.tsx
├── backend/
│   ├── __init__.py
│   ├── service.py
│   └── schemas.py
├── dist/
│   └── index.esm.js
└── knowledge/
    └── vector.db
```

说明：

- `manifest.json`：插件元信息，供宿主和 LLM 理解插件能力
- `src/index.ts`：前端入口，统一导出组件
- `src/*.tsx`：插件前端组件实现
- `backend/service.py`：插件专属 Python 逻辑入口
- `backend/schemas.py`：插件内部输入输出结构定义
- `dist/index.esm.js`：前端构建产物
- `knowledge/vector.db`：可选知识库

要点：

- `backend/` 存在，并不意味着插件是独立后端项目
- 它只是宿主加载的一个后端模块目录

---

## 5. 开发流程总览

推荐按这个顺序开发：

1. 明确教学场景
2. 判断是否真的需要插件专属后端
3. 缩小 LLM 可控参数范围
4. 先设计接口，再写组件/后端代码
5. 编写 `manifest.json`
6. 在 Gallery 和真实对话里验证

强烈建议先让 AI 帮你做“方案设计”，再让 AI 写代码，而不是一开始就让 AI 随意生成整个目录。

---

## 6. Step 1：定义插件边界

开始写代码前，请先回答下面 6 个问题：

1. 这个插件要帮助学生理解什么概念？
2. 学生最终看到的核心表现是什么？
3. 哪些参数需要由 LLM 或外部 A2UI 传入？
4. 哪些交互适合内置在组件内部？
5. 有没有哪部分必须依赖 Python 库或后端计算？
6. 这部分后端逻辑是否只属于这个插件？

### 命名规则

- 插件 ID 用 `kebab-case`
  - 例如：`chemistry-molecule-3d`
  - 例如：`math-function-plotter`
- 组件 ID 用 `PascalCase`
  - 例如：`MoleculeViewer`
  - 例如：`FunctionPlotter`
- 后端 action 名建议用 `snake_case`
  - 例如：`generate_structure`
  - 例如：`sample_orbital_density`

### 目录命名建议

- 用“学科 + 能力”命名
- 优先描述教学用途，而不是实现技术

好例子：

- `physics-high-school`
- `chemistry-orbital-3d`
- `chemistry-molecule-3d`

不推荐：

- `threejs-demo`
- `canvas-test`
- `plugin-final-v2`

---

## 7. Step 2：编写前端组件

### 7.1 组件接口

插件组件通过 A2UI 渲染链路接收 `node`：

```tsx
interface A2UINode {
  properties?: Record<string, unknown>
}

export default function MyComponent({ node }: { node: A2UINode }) {
  const props = node.properties ?? {}
  return <div>{JSON.stringify(props)}</div>
}
```

核心规则：

- 组件必须接收 `{ node }`
- 参数从 `node.properties` 读取
- 所有参数都要有默认值
- 组件必须能处理 LLM 漏传、错传、部分传值的情况

### 7.2 推荐的参数解析辅助函数

```tsx
function parseNum(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseStr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function parseBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}
```

### 7.3 组件开发原则

- 优先用原生 DOM / Canvas / SVG
- 先把教学表达做清楚，再考虑特效
- 参数越少越好，但要保留教学表达力
- 内部状态与外部 props 变化都要兼容
- 组件必须能在聊天页和 Gallery 同时工作

### 7.4 什么时候前端组件应该调用插件后端

如果组件要展示的数据来自插件专属 Python 逻辑，推荐这样分工：

- 前端组件负责渲染与局部交互
- 插件后端负责计算、生成、解析
- 宿主负责触发插件后端调用并把结果送回前端链路

尽量避免：

- 前端组件直接假定自己能绕过宿主请求某个私有 URL
- 把宿主还没定义的接口写死在组件里

也就是说，组件应该依赖“宿主支持的插件能力调用机制”，而不是自行发明通信协议。

### 7.5 设计语言要求

遵循项目现有设计规范：

- 背景色优先用 `#faf9f5`
- 文本色优先用 `#1b1c1a`
- 主色优先用 `#182544`
- 强调色谨慎使用 `#775a19`
- 少用硬边框，优先通过背景层次和留白分区
- 保持“高端编辑排版”感，而不是工具面板感

---

## 8. Step 3：编写插件后端模块

这一节只在插件确实需要 Python 参与时使用。

### 8.1 推荐职责

插件后端模块适合做：

- 调用 Python 科学计算库
- 生成前端展示所需结构化数据
- 做复杂解析或转换
- 做学科专属推导

插件后端模块不适合做：

- 自己定义整套路由体系
- 自己管理用户登录、会话和权限
- 自己长成一个完整服务

### 8.2 推荐接口风格

文档层面建议所有插件后端都按“动作调用”模型设计。

推荐心智模型：

```python
class PluginBackendService:
    async def invoke(self, action: str, payload: dict, context: dict) -> dict:
        ...
```

然后在内部按 action 分发：

```python
async def invoke(action: str, payload: dict, context: dict) -> dict:
    if action == "generate_structure":
        return await generate_structure(payload, context)
    if action == "estimate_bond_angle":
        return await estimate_bond_angle(payload, context)
    raise ValueError(f"Unsupported action: {action}")
```

这样设计的好处：

- 宿主容易统一接入
- AI 也容易理解调用边界
- 插件后端不会无限膨胀成一个小框架

### 8.3 输入输出建议

输入和输出都建议保持：

- 小而明确
- 可 JSON 化
- 不暴露宿主内部实现细节

好例子：

```python
{
  "molecule_name": "H2O",
  "temperature": 25
}
```

返回：

```python
{
  "atoms": [...],
  "bonds": [...],
  "metadata": {
    "display_name": "Water",
    "formula": "H2O"
  }
}
```

不推荐：

- 返回一大坨难以约束的任意对象
- 输入输出依赖宿主私有 ORM 对象
- 把 Python 内部状态直接暴露给前端

### 8.4 设计原则

- 优先无状态
- 优先纯函数式输入输出
- 把“计算”与“宿主调用协议”分开
- 把第三方库调用封装在小函数里
- 对异常、空结果、非法参数做显式处理

### 8.5 AI 友好的写法

如果你要让 AI 生成插件后端，请明确要求：

- 不要生成独立 FastAPI app
- 不要定义插件私有 HTTP 服务
- 只生成一个可被宿主调用的 Python 模块
- 依赖输入 `action + payload + context`
- 返回 JSON 兼容的字典

---

## 9. Step 4：编写入口文件

`src/index.ts` 负责导出组件：

```ts
import MoleculeViewer from './MoleculeViewer'

export default {
  components: {
    MoleculeViewer,
  },
}
```

规则：

- 必须是 `export default`
- 必须包含 `components`
- `components` 的 key 必须和 `manifest.json` 中的 `component_id` 一致

多组件插件示例：

```ts
import MoleculeViewer from './MoleculeViewer'
import PeriodicTable from './PeriodicTable'

export default {
  components: {
    MoleculeViewer,
    PeriodicTable,
  },
}
```

---

## 10. Step 5：编写 manifest.json

`manifest.json` 的作用不是“列字段”，而是：

**让系统和 LLM 理解你的插件能做什么、不能做什么、什么时候该调它，以及它是否依赖插件专属后端。**

### 10.1 纯前端插件示例

```json
{
  "id": "math-function-plotter",
  "version": "1.0.0",
  "subject": "math",
  "name": "函数绘图插件",
  "keywords": ["函数", "图像", "坐标系", "抛物线"],
  "entry": {
    "js": "dist/index.esm.js",
    "vector_db": "knowledge/vector.db"
  },
  "sharedDependencies": ["react", "react-dom", "@a2ui/react"],
  "capabilities": [
    {
      "component_id": "FunctionPlotter",
      "name": "函数图像绘制器",
      "tags": ["函数", "图像", "二维"],
      "props_schema": {
        "expression": {
          "type": "string",
          "default": "y=x^2",
          "description": "要展示的函数表达式"
        }
      },
      "a2ui_hint": "适合直接展示函数图像。组件内部已处理缩放与坐标轴显示，LLM 只需传入 expression。",
      "expresses": ["函数图像", "趋势变化", "参数影响"],
      "educational_use": "帮助学生理解函数表达式与图像之间的关系。",
      "cannot_express": ["严格符号证明", "高维几何对象"]
    }
  ]
}
```

### 10.2 带插件专属后端的插件示例

```json
{
  "id": "chemistry-molecule-3d",
  "version": "1.0.0",
  "subject": "chemistry",
  "name": "分子结构 3D 插件",
  "keywords": ["分子", "化学键", "空间结构", "键角", "分子模型"],
  "entry": {
    "js": "dist/index.esm.js",
    "vector_db": "knowledge/vector.db",
    "python_module": "plugins.chemistry-molecule-3d.backend.service"
  },
  "backend": {
    "kind": "hosted-plugin-service",
    "capabilities": ["generate_structure", "estimate_bond_angle"]
  },
  "sharedDependencies": ["react", "react-dom", "@a2ui/react"],
  "capabilities": [
    {
      "component_id": "MoleculeViewer",
      "name": "分子结构查看器",
      "tags": ["分子", "3D", "化学键", "空间结构"],
      "props_schema": {
        "moleculeName": {
          "type": "string",
          "default": "H2O",
          "description": "要展示的分子名称或化学式"
        },
        "displayMode": {
          "type": "string",
          "default": "ball-stick",
          "description": "展示模式，如 ball-stick 或 space-filling"
        }
      },
      "a2ui_hint": "适合展示单个分子的三维结构。若需要真实结构数据，应先通过插件后端生成，再交给组件渲染。组件内部可处理旋转、缩放等局部交互，LLM 不要重复生成这些控制按钮。",
      "expresses": ["分子空间结构", "键角", "键长关系", "原子连接方式"],
      "educational_use": "帮助学生直观理解分子的三维几何结构与化学键关系。",
      "cannot_express": ["完整量子化学模拟", "复杂反应动力学", "实验级精确测量"]
    }
  ]
}
```

### 10.3 推荐字段说明

| 字段 | 作用 |
|------|------|
| `id` | 插件唯一标识，通常和目录名一致 |
| `version` | 插件版本 |
| `subject` | 学科分类 |
| `name` | 给人看的中文名称 |
| `keywords` | 用于意图路由和检索 |
| `entry.js` | 前端动态加载入口 |
| `entry.vector_db` | 可选知识库入口 |
| `entry.python_module` | 可选插件后端模块入口 |
| `backend.kind` | 标记这是宿主托管型插件后端 |
| `backend.capabilities` | 该插件后端支持哪些动作 |
| `sharedDependencies` | 由宿主统一提供的共享依赖 |
| `capabilities` | 供 LLM 理解和调用的核心能力描述 |

### 10.4 `a2ui_hint` 怎么写

`a2ui_hint` 是最关键字段之一。它决定 LLM 会不会正确使用你的组件。

一个好的 `a2ui_hint` 应该说明：

- 组件适合什么场景
- LLM 应传哪些关键参数
- 哪些交互已经内置，不要重复生成
- 如果依赖插件后端，应该先做什么

好例子：

```text
适合展示单个分子的三维结构。若需要真实结构数据，应先通过插件后端生成，再交给组件渲染。组件内部已支持旋转和缩放，不要重复生成这些控制按钮。
```

不好的例子：

```text
这是一个很酷的 3D 组件。
```

### 10.5 `props_schema` 怎么设计

建议：

- 只暴露真正有教学意义的参数
- 每个参数都提供默认值
- 数值参数尽量给 `min` / `max`
- 参数名用英文 camelCase
- `description` 用自然语言解释“它控制什么”

不要把所有内部状态都暴露出去。

### 10.6 什么时候把能力写到前端，什么时候写到后端

写到前端：

- 渲染逻辑
- 轻量局部交互
- 简单状态切换

写到插件后端：

- 复杂计算
- Python 库调用
- 数据解析、转换、采样、求解

---

## 11. Step 6：构建与验证

常规构建命令：

```bash
npm run build
```

如果支持监听模式：

```bash
npm run dev
```

### 验证顺序

建议按这个顺序验证：

1. 前端组件能否构建成功
2. `manifest.json` 是否与导出内容一致
3. 如有插件后端，后端模块接口是否清晰、输入输出是否稳定
4. Gallery 是否能正常预览
5. 宿主是否能扫描并加载插件
6. 对话中 LLM 是否会正确调用组件
7. 如涉及插件后端，宿主是否能正确触发对应动作

### Gallery 验证

访问：

```text
http://localhost:5173/?gallery=1
```

检查：

- 是否能看到组件
- 样式是否正常
- 默认参数是否合理
- 不同尺寸下是否还能工作

### 对话验证

用具体提示语测试，例如：

- “展示一个水分子的三维结构”
- “显示二氧化碳的空间结构，并指出键角”
- “用这个组件演示不同分子的几何形状差异”

如果 LLM 没有调用组件，优先检查：

- `keywords`
- `tags`
- `a2ui_hint`
- `educational_use`
- 插件是否正确声明了需要的后端能力

---

## 12. 依赖与体积控制规则

这是当前插件策略里最重要的约束之一。

### 12.1 默认原则

- `react`、`react-dom`、`@a2ui/react` 等平台依赖由宿主提供
- 插件不要重复安装和重复打包这些依赖
- 多个插件可能共用的库，优先升级为共享依赖

### 12.2 什么时候可以加插件私有前端依赖

只有在下面情况才建议新增：

- 它只服务当前插件
- 原生实现成本明显过高
- 体积可控
- 不会和宿主共享运行时冲突

### 12.3 什么时候可以加插件私有 Python 依赖

只有在下面情况才建议新增：

- 这是该插件的核心能力
- 不适合提炼成宿主通用能力
- 没有合理的轻量替代方案
- 能清楚说明为什么纯前端不适合

### 12.4 不要因为这些理由随便加依赖

- 只是为了画简单图形
- 只是为了做轻量动画
- 只是为了少写几十行代码
- 只是为了“这个库看起来方便”

### 12.5 给 AI 的依赖约束写法

```text
不要新增外部依赖。优先使用 React + 原生 Canvas / SVG / DOM。
如果你认为必须新增前端或 Python 依赖，请先说明：
1. 为什么现有方案不够
2. 这是前端依赖还是插件专属 Python 依赖
3. 它是否只服务当前插件
4. 体积、复杂度和维护成本影响
```

---

## 13. 给 AI 工具的开发模板

这一节可以直接复制使用。

### 13.1 先让 AI 做方案设计

```text
我要为 AhaTutor 开发一个新插件。

请先不要直接写代码，先帮我完成插件方案设计。

插件目标：
- 学科：
- 教学场景：
- 学生/老师最终会看到什么：
- 用户可交互的内容：

请输出：
1. 推荐的插件 ID
2. 推荐的组件名
3. 这个插件是否需要宿主托管的专属 Python 后端
4. 如果需要，请列出建议的 backend actions
5. 建议暴露给 LLM 的 props 列表
6. 每个 prop 的类型、默认值、合理范围
7. 哪些交互应该内置在组件里，哪些应交给外部 A2UI
8. 是否需要知识库
9. 是否需要新增依赖；如果需要，请说明为什么不能用现有共享依赖或原生 API 实现

约束：
- 这是 AhaTutor 插件，不是独立前后端项目
- 宿主提供 React、react-dom、@a2ui/react、FastAPI 平台能力
- 如果需要 Python，只能生成“宿主托管的插件后端模块”，不能生成独立 FastAPI 服务
- 优先减少参数数量，但保留教学表达力
- 风格遵循 AhaTutor 设计语言：#faf9f5、#1b1c1a、#182544、#775a19
```

### 13.2 让 AI 生成前端组件

```text
请基于下面的插件方案，生成一个 AhaTutor 插件前端组件文件。

要求：
- 输出文件：src/MyComponent.tsx
- 组件签名必须是 export default function ComponentName({ node }: { node: A2UINode })
- 参数从 node.properties 读取
- 所有参数都要有默认值
- 使用 parseNum / parseStr / parseBool 之类的安全解析辅助函数
- 如果组件有内部状态，要用 useEffect 响应外部 props 变化
- 优先使用原生 Canvas / SVG / DOM
- 不要新增任何外部依赖
- 样式使用 inline style
- 组件需要在聊天页和 Gallery 同时正常工作

补充背景：
- 插件不是独立应用
- React、react-dom、@a2ui/react 由宿主提供
- 如果涉及数据计算，前端只负责渲染，不要自行发明后端接口

插件方案：
[把方案粘贴到这里]
```

### 13.3 让 AI 生成插件后端模块

```text
请为 AhaTutor 插件生成一个宿主托管型插件后端模块。

要求：
- 输出文件：backend/service.py
- 不要生成独立 FastAPI app
- 不要定义独立 HTTP 路由
- 只生成可被宿主调用的 Python 模块
- 入口采用 invoke(action: str, payload: dict, context: dict) -> dict 的风格
- 按 action 分发到具体函数
- 返回结果必须可 JSON 化
- 对非法 action、非法 payload、空结果做明确错误处理
- 可以使用 Python 科学计算库，但要把库调用封装在小函数里

插件方案：
[把方案粘贴到这里]
```

### 13.4 让 AI 生成 manifest.json

```text
请根据下面的插件设计，为 AhaTutor 生成 manifest.json。

输出要求：
- 只输出合法 JSON
- 必须包含 id、version、subject、name、keywords、entry、sharedDependencies、capabilities
- 如果插件需要宿主托管型 Python 后端，还要包含 backend 和 entry.python_module
- sharedDependencies 默认包含 react、react-dom、@a2ui/react

写作要求：
- a2ui_hint 必须具体，明确告诉 LLM 应该怎么使用组件
- 如果依赖插件后端，要在 a2ui_hint 中说清楚
- props_schema 只暴露真正必要的参数
- cannot_express 要诚实，不要夸大能力

组件说明：
[粘贴组件说明或代码]

后端说明：
[粘贴后端 action 说明]
```

### 13.5 让 AI 帮你查错

```text
我在开发 AhaTutor 插件时遇到了问题，请帮我排查。

问题表现：
[描述现象]

相关文件：
[粘贴组件代码]
[粘贴 manifest.json]
[如果有 backend/service.py 也一起粘贴]

如果有报错：
[粘贴控制台或后端报错]

请按下面顺序分析：
1. 前端组件接口是否符合 A2UI 插件约定
2. manifest.json 是否和组件导出一致
3. 如果存在插件后端，invoke/action 设计是否合理
4. 是否错误地生成了独立插件后端服务
5. 是否依赖了宿主未提供的运行时
6. 是否把本应共享的依赖写成了私有依赖
7. 给出最小修改方案
```

---

## 14. 从现有代码改造成插件

你可以把现成的 React demo、Canvas demo、CodePen、科研脚本改造成插件，但目标不是“原样搬运”，而是：

**提炼成适合 LLM 调用的教学能力。**

### 改造时优先做的事

1. 识别哪些参数值得交给 LLM 控制
2. 识别哪些逻辑必须保留在 Python 侧
3. 去掉和教学无关的复杂配置
4. 去掉不必要的第三方依赖
5. 把平台逻辑和学科逻辑分开
6. 用 `node.properties` 作为统一前端输入接口
7. 用 `invoke(action, payload, context)` 作为统一后端思路

### 给 AI 的改造提示词

```text
我要把一段现有代码改造成 AhaTutor 插件。

请先分析，不要马上重写全部代码。

请回答：
1. 这段代码的核心教学表达是什么
2. 哪些参数适合暴露给 LLM
3. 哪些逻辑适合留在前端组件
4. 哪些逻辑必须放到插件专属 Python 后端
5. 哪些第三方依赖可以去掉
6. 推荐的插件 ID、组件名、backend actions、manifest 关键词

约束：
- 目标是 AhaTutor 插件，不是独立前后端项目
- 宿主提供共享运行时
- 如果需要 Python，只能生成宿主托管的插件后端模块
- 优先减少外部依赖
- 优先保留教学表达，弱化炫技效果

原始代码如下：
[粘贴原始代码]
```

### 改造时的危险信号

- AI 想保留大量第三方库
- AI 把所有内部状态都暴露成 props
- AI 生成为了调试方便而自带一个独立 FastAPI
- AI 把插件写成“一个迷你应用”
- AI 没有明确教学边界，只是在堆功能

---

## 15. 验收清单

提交前至少确认下面这些项：

- [ ] 插件目录命名合理，`id` 和目录名一致
- [ ] 前端入口 `src/index.ts` 正确导出
- [ ] `component_id` 与组件导出名一致
- [ ] 组件从 `node.properties` 读取参数
- [ ] 所有参数都有默认值
- [ ] `manifest.json` 能清楚表达能力边界
- [ ] `a2ui_hint` 足够具体
- [ ] 如有插件后端，明确采用宿主托管型模块，而不是独立服务
- [ ] 如有插件后端，action 列表清晰，输入输出可 JSON 化
- [ ] 没有把共享依赖重复打包进插件
- [ ] 没有为了小功能引入大依赖
- [ ] Gallery 中能正常显示
- [ ] 在真实对话里，LLM 能较稳定地调用它
- [ ] 视觉风格符合项目设计规范

---

## 16. 常见问题

### Q1：每个插件还需要有自己的独立依赖吗？

默认不需要。

新的插件策略下：

- 平台级依赖由宿主统一提供
- 插件只保留必要的私有依赖
- 如果多个插件都可能用到某个库，应优先考虑提炼为共享依赖

### Q2：插件能不能带 Python 代码？

可以，而且在某些场景下很合理。

但推荐形态是：

- 插件提供宿主托管的 Python 模块
- 宿主统一调用它

不推荐形态是：

- 插件自己拥有独立 FastAPI 服务
- 插件自己管理路由、会话和平台能力

### Q3：什么时候应该做插件专属后端？

当满足以下情况时可以考虑：

- 前端实现成本过高
- 必须依赖成熟 Python 库
- 逻辑明显是学科专属，而非平台通用能力

### Q4：什么时候不应该做插件专属后端？

如果只是：

- 简单渲染
- 轻量动画
- 基本交互
- 少量前端可直接完成的数据处理

那通常没必要上 Python。

### Q5：什么时候应该让组件内置控件，什么时候交给外部 A2UI？

一般规则：

- 高度耦合、局部性的交互，适合内置
- 通用、可编排、适合被 LLM 外部控制的参数，适合作为 props 暴露

### Q6：如果 AI 总是生成不合适的代码怎么办？

把提示词从“帮我写一个插件”改成分阶段：

1. 先做方案设计
2. 再写前端组件
3. 再写插件后端模块
4. 再写 `manifest.json`
5. 最后做审查和收敛

不要一次要求它“生成整个项目”。

### Q7：插件最重要的成功标准是什么？

不是“代码很多”，也不是“效果很炫”，而是：

- LLM 能稳定知道什么时候该调它
- 调用后参数基本正确
- 前端组件能清晰表达教学内容
- 如有插件后端，宿主能稳定调用它并拿到可靠结果
- 交互自然，不干扰对话

---

## 一句话原则

为 AhaTutor 开发插件时，始终把自己当成是在为一个既有平台增加“可被 AI 调用的学科能力”。

不要重复造平台。  
不要让依赖失控。  
不要把插件做成另一个应用。  
也不要把“需要 Python”误解成“必须自带独立后端系统”。

把边界定义清楚，把能力表达清楚，把接口写清楚，AI 和宿主系统才会真正用好你的插件。
