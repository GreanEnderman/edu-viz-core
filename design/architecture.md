# AhaTutor v2.0 系统架构设计文档

> 版本：v0.2
> 日期：2026-03-29
> 状态：设计阶段（已整合 @a2ui/react 库）

---

## 目录

1. [系统概述](#1-系统概述)
2. [整体架构](#2-整体架构)
3. [目录结构规范](#3-目录结构规范)
4. [核心模块详细设计](#4-核心模块详细设计)
5. [插件规范](#5-插件规范)
6. [A2UI 消息协议](#6-a2ui-消息协议)
7. [前后端接口定义](#7-前后端接口定义)
8. [关键技术决策](#8-关键技术决策)
9. [数据流全链路示例](#9-数据流全链路示例)

---

## 1. 系统概述

AhaTutor v2.0 是一个面向学科教育的 AI 辅导系统，基于 **A2UI（Agent-to-UI）协议**（Google 开源，`vendor/A2UI-main`）实现 AI 驱动的交互式学科组件渲染。

**核心机制**：后端 LLM 在流式回答中嵌入 A2UI JSONL 消息，前端 `@a2ui/react` 库解析并渲染对应的学科可视化组件（物理模拟器、几何工具等）。用户与组件的交互通过 A2UI `onAction` 回调回传给后端，形成闭环。

**关键依赖**：`vendor/A2UI-main/renderers/react`（包名 `@a2ui/react`，v0.8.0），支持 React 18/19，提供：
- `A2UIProvider` / `A2UIRenderer`：渲染引擎
- `useA2UI` / `processMessages`：消息处理
- `ComponentRegistry`：自定义组件注册
- `onAction`：用户交互回调

系统由三层构成：

- **本体层（Host）**：React 应用，对话界面 + `@a2ui/react` 渲染引擎 + 插件 catalog 注册
- **插件层（Plugin）**：学科插件，每个插件包含学科知识库（向量数据库）和 React 组件集合
- **后端编排层（Backend）**：FastAPI，RAG 检索 + 意图路由 + A2UI JSONL 构建 + SSE 流式输出


---

## 2. 整体架构

```
┌──────────────────────────────────────────────────────────────────┐
│                          用户浏览器                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   React 本体 (Host App)                     │  │
│  │                                                            │  │
│  │  ┌──────────────┐        ┌─────────────────────────────┐  │  │
│  │  │  Chat UI     │        │   @a2ui/react 渲染引擎        │  │  │
│  │  │  (对话界面)   │        │                             │  │  │
│  │  │              │        │  A2UIProvider               │  │  │
│  │  │  TextBubble  │        │    ├─ A2UIRenderer           │  │  │
│  │  │  InputBox    │        │    │   (surfaceId="main")    │  │  │
│  │  │              │        │    └─ ComponentRegistry      │  │  │
│  │  └──────┬───────┘        │        ├─ 标准组件 (Button…) │  │  │
│  │         │                │        └─ 学科组件 (插件注册) │  │  │
│  │  ┌──────▼───────┐        └──────────────┬──────────────┘  │  │
│  │  │ StreamSplitter│                       │ onAction         │  │
│  │  │ 分离文本流和  │                       ▼                  │  │
│  │  │ A2UI JSONL流  │        ┌──────────────────────────────┐  │  │
│  │  └──────┬───────┘        │     ActionHandler            │  │  │
│  │         │processMessages │  回传用户交互 → 触发新请求    │  │  │
│  │         └────────────────►──────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         ▲ SSE (text行 + JSONL行混合)        │ HTTP POST
         │                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        FastAPI 后端                               │
│                                                                  │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ IntentRouter   │→ │  Retriever   │→ │  PromptBuilder      │  │
│  │ (意图路由)      │  │ (RAG检索)    │  │ (注入A2UI格式指令)  │  │
│  └────────────────┘  └──────────────┘  └──────────┬──────────┘  │
│                                                    │             │
│  ┌─────────────────────────────────────────────────▼──────────┐  │
│  │              LLM 调用 + SSE 流式输出                        │  │
│  │  普通文本行：直接透传                                        │  │
│  │  A2UI消息行：JSONL格式，每行一个完整JSON对象                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  PluginsManager：扫描 /plugins，维护 catalog 注册表          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         ▲ 向量检索                          │
         │                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│  /plugins/physics-high-school/   /plugins/math-geometry/  ...   │
│    manifest.json                   manifest.json                 │
│    /knowledge/vector.db            /knowledge/vector.db          │
│    /src/ (React 组件源码)           /src/ (React 组件源码)        │
└──────────────────────────────────────────────────────────────────┘
```


---

## 3. 目录结构规范

```
/aha-tutor/
├── /frontend/                          # React 前端应用
│   ├── /public/
│   └── /src/
│       ├── /a2ui-engine/               # A2UI 集成层（轻薄，主要是配置和桥接）
│       │   ├── A2UISetup.tsx           # A2UIProvider 配置，注入 onAction 回调
│       │   ├── StreamSplitter.ts       # SSE 流分离：文本行 vs JSONL行
│       │   └── CatalogRegistry.ts      # 启动时加载插件组件，注册到 ComponentRegistry
│       ├── /components/
│       │   ├── /Chat/
│       │   │   ├── MessageStream.tsx   # 混合渲染：TextBubble + A2UIRenderer
│       │   │   ├── TextBubble.tsx      # 普通文本气泡（流式渲染）
│       │   │   └── A2UISurface.tsx     # 包装 <A2UIRenderer surfaceId="main" />
│       │   ├── /UI/                    # 通用基础组件（Button, Input, Modal）
│       │   └── /Layout/               # 侧边栏、顶栏、背景层
│       ├── /hooks/
│       │   ├── useChat.ts              # 对话流程管理，处理 SSE 连接
│       │   └── useA2UIActions.ts       # 处理 onAction 回调，格式化并回传后端
│       ├── /store/
│       │   └── chatStore.ts            # 对话历史、流式缓冲状态（Zustand）
│       ├── /api/
│       │   └── chat.ts                 # SSE 连接封装
│       ├── App.tsx
│       └── main.tsx
│
├── /backend/                           # FastAPI 后端
│   └── /app/
│       ├── /api/v1/
│       │   ├── chat.py                 # POST /chat → SSE 流式响应
│       │   └── plugins.py              # GET /plugins → 插件 manifest 列表
│       ├── /orchestrator/
│       │   ├── intent_router.py        # 意图分类，决定调用哪个学科插件
│       │   ├── retriever.py            # 混合检索：本体库 + 学科插件库
│       │   ├── prompt_builder.py       # 组装 Prompt（含 A2UI 格式指令 + 可用组件列表）
│       │   └── a2ui_builder.py         # 构建 A2UI JSONL 消息插入流中
│       ├── /plugins_manager/
│       │   ├── loader.py               # 启动时扫描 /plugins，读取 manifest
│       │   └── registry.py             # 内存注册表（component_id → 插件信息）
│       ├── /models/
│       │   └── a2ui_schema.py          # A2UI 消息 Pydantic 模型（v0.8）
│       ├── /core/
│       │   ├── config.py
│       │   └── security.py
│       └── main.py
│
├── /plugins/                           # 插件物理存放区
│   └── /physics-high-school/
│       ├── manifest.json
│       ├── /src/                       # React 组件源码（与前端共享构建）
│       │   ├── PhysicsOscillator.tsx   # 简谐运动组件
│       │   └── index.ts               # 导出组件 + catalog 注册配置
│       └── /knowledge/                # 向量索引（仅后端使用）
│           └── vector.db
│
├── /design/                            # 系统设计文档
│   ├── architecture.md
│   └── development-plan.md
│
└── /data/                              # 本体基础知识库
    └── vector.db
```

> **插件组件与前端的关系**：插件 `/src` 中的 React 组件在前端构建时作为本地依赖引入，通过 `CatalogRegistry.ts` 注册到 `@a2ui/react` 的 `ComponentRegistry`，不再使用动态 `<script>` 注入。


---

## 4. 核心模块详细设计

### 4.1 A2UI React 集成层

**文件**：`frontend/src/a2ui-engine/A2UISetup.tsx`

`@a2ui/react` 提供了完整的渲染引擎，我们只需配置 `A2UIProvider` 并注入 `onAction` 回调。

```tsx
// A2UISetup.tsx
import { A2UIProvider, A2UIRenderer, injectStyles } from '@a2ui/react';
import { initializeCatalog } from './CatalogRegistry';
import { useA2UIActions } from '../hooks/useA2UIActions';

injectStyles(); // 注入 A2UI 基础样式，应用启动时调用一次
initializeCatalog(); // 注册所有学科插件组件

export function A2UISurface() {
  const { handleAction } = useA2UIActions();

  return (
    <A2UIProvider onAction={handleAction}>
      <A2UIRenderer surfaceId="main" />
    </A2UIProvider>
  );
}
```

### 4.2 SSE 流分离器 (StreamSplitter)

**文件**：`frontend/src/a2ui-engine/StreamSplitter.ts`

**核心问题**：后端 SSE 流中混合了两种内容：
- 普通文本行 → 渲染到对话气泡
- A2UI JSONL 行（每行是完整 JSON 对象）→ 传给 `processMessages`

**判断依据**：A2UI JSONL 行以 `{` 开头且包含 `surfaceUpdate` 或 `dataModelUpdate` 或 `beginRendering` 字段。

```typescript
// StreamSplitter.ts
export type SplitResult =
  | { type: 'text'; content: string }
  | { type: 'a2ui'; message: object };

const A2UI_KEYS = ['surfaceUpdate', 'dataModelUpdate', 'beginRendering'];

export function splitLine(line: string): SplitResult {
  const trimmed = line.trim();
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      if (A2UI_KEYS.some(k => k in obj)) {
        return { type: 'a2ui', message: obj };
      }
    } catch {
      // 解析失败，视为普通文本
    }
  }
  return { type: 'text', content: line };
}
```

在 `useChat.ts` 中，每收到一个 SSE chunk：

```typescript
const result = splitLine(chunk);
if (result.type === 'text') {
  chatStore.appendText(result.content);
} else {
  processMessages([result.message]); // @a2ui/react 的 useA2UI hook
}
```


### 4.3 插件目录注册 (CatalogRegistry)

**文件**：`frontend/src/a2ui-engine/CatalogRegistry.ts`

学科插件的 React 组件在构建时静态导入，通过 `ComponentRegistry` 注册为自定义 catalog。`@a2ui/react` 的 `ComponentRegistry` 允许注册任意 React 组件，注册时指定 `componentType` 名称，与后端 manifest 中的 `component_id` 对应。

```typescript
// CatalogRegistry.ts
import { ComponentRegistry, registerDefaultCatalog } from '@a2ui/react';
import { PhysicsOscillator } from '../../../plugins/physics-high-school/src';
import { GeoCanvas } from '../../../plugins/math-geometry/src';

export function initializeCatalog() {
  // 注册 A2UI 标准组件（Button, Text, Slider 等）
  registerDefaultCatalog(ComponentRegistry);

  // 注册学科插件组件
  ComponentRegistry.register({
    componentType: 'PhysicsOscillator',
    component: PhysicsOscillator,
  });
  ComponentRegistry.register({
    componentType: 'GeoCanvas',
    component: GeoCanvas,
  });
  // 后续新增插件：在此追加 register 调用
}
```

> **注意**：插件组件是普通 React 组件，接收 `props`（由 A2UI data model 绑定），通过 `onAction` 回调发出用户交互事件。不再使用 Web Components / Shadow DOM / 动态 script 注入。

### 4.4 用户交互回传 (onAction)

**文件**：`frontend/src/hooks/useA2UIActions.ts`

`@a2ui/react` 已内置了完整的双向通信机制。组件内部通过 A2UI `action` 属性（`event` 类型）触发回调，`A2UIProvider` 的 `onAction` 统一接收，无需自定义 EventBus。

```typescript
// useA2UIActions.ts
import { A2UIClientEventMessage } from '@a2ui/react';
import { chatStore } from '../store/chatStore';
import { chatApi } from '../api/chat';

export function useA2UIActions() {
  const handleAction = (message: A2UIClientEventMessage) => {
    // message.action.name: 事件名（如 'param_update'）
    // message.action.context: 事件携带的数据（如 { amplitude: 3.5 }）
    chatStore.appendInteractionContext(message);
    chatStore.triggerFollowUp(); // 触发新一轮对话请求
  };

  return { handleAction };
}
```

**插件组件内部**（以 `PhysicsOscillator` 为例）使用标准 A2UI Slider 组件，action 由 A2UI 协议自动处理，无需手动 dispatch 事件：

```tsx
// 后端生成的 A2UI 消息中，Slider 的 action 已声明
// 无需在组件代码里手动写事件分发
{
  "id": "amplitude-slider",
  "component": { "Slider": {
    "value": { "path": "/oscillator/amplitude" },
    "min": 0, "max": 10,
    "action": { "event": {
      "name": "param_update",
      "context": { "amplitude": { "path": "/oscillator/amplitude" } }
    }}
  }}
}
```


### 4.5 RAG 编排器

**文件**：`backend/app/orchestrator/`

```
用户消息
  │
  ▼
intent_router.py  → 关键词匹配插件 manifest keywords，返回命中插件列表
  │
  ▼
retriever.py      → 并行检索本体库 + 命中学科插件库，返回 top-k 片段
  │
  ▼
prompt_builder.py → 组装 Prompt：系统指令 + 检索片段 + A2UI 输出规范
                    （注入可用组件列表，含各组件的 props schema）
  │
  ▼
LLM 流式调用      → 输出混合流：普通文本行 + A2UI JSONL 行
  │
  ▼
SSE 透传          → 原始流直接推送给前端，前端 StreamSplitter 负责分离
```

`prompt_builder.py` 向 LLM 注入的 A2UI 输出规范示例：

```
当回答需要可视化时，在文本中插入 A2UI JSONL 消息（每行一个完整 JSON 对象）：

{"surfaceUpdate":{"surfaceId":"main","components":[...]}}
{"dataModelUpdate":{"surfaceId":"main","contents":[...]}}
{"beginRendering":{"surfaceId":"main","root":"root-id"}}

可用组件：{available_components_with_schema}
注意：JSONL 消息必须与普通文本分行，每条 JSON 独占一行。
```

### 4.6 意图路由器

**文件**：`backend/app/orchestrator/intent_router.py`

```python
from app.plugins_manager.registry import plugin_registry

def route_intent(user_message: str) -> list[str]:
    """
    返回命中的插件 ID 列表，按关键词命中数降序排列。
    后期可替换为嵌入模型相似度匹配，接口不变。
    """
    scores: dict[str, int] = {}
    for plugin in plugin_registry.all():
        for keyword in plugin.keywords:
            if keyword in user_message:
                scores[plugin.id] = scores.get(plugin.id, 0) + 1
    return [
        pid for pid, _ in
        sorted(scores.items(), key=lambda x: x[1], reverse=True)
        if scores[pid] > 0
    ]
```

---

## 5. 插件规范

### 5.1 manifest.json 完整规范

```json
{
  "id": "aha-physics-pro",
  "version": "1.2.0",
  "subject": "physics",
  "name": "高中物理插件",
  "keywords": ["振动", "简谐运动", "波", "力学", "电磁", "光学"],
  "entry": {
    "vector_db": "/plugins/physics-high-school/knowledge/vector.db"
  },
  "capabilities": [
    {
      "component_id": "PhysicsOscillator",
      "name": "简谐运动模拟器",
      "tags": ["振动", "简谐运动"],
      "props_schema": {
        "amplitude": { "type": "number", "default": 1, "min": 0, "max": 10 },
        "freq":      { "type": "number", "default": 1 },
        "phase":     { "type": "number", "default": 0 }
      },
      "a2ui_hint": "使用 Slider 组件绑定 amplitude/freq/phase，配合 Canvas 渲染波形"
    }
  ]
}
```

| 字段 | 说明 |
|------|---------|
| `keywords` | 意图路由匹配用 |
| `entry.js` | 插件构建产物路径（如 `dist/index.esm.js`），前端通过 dynamic import() 加载 |
| `entry.vector_db` | 后端 RAG 检索路径 |
| `capabilities[].component_id` | 与插件 default export `components` 对象的 key 一致 |
| `capabilities[].a2ui_hint` | 提示 LLM 如何使用标准 A2UI 组件构建该界面 |

### 5.2 插件组件开发约定

- 插件组件是**普通 React 组件**，接收 A2UI data model 绑定的 props
- 若使用自定义渲染（Canvas、WebGL），组件自行管理 DOM，通过 `useEffect` + `ref` 操作
- 复杂交互优先使用 A2UI 标准组件（`Slider`、`Button` 等）声明，由后端在 JSONL 中描述，而非在 React 组件内硬编码 UI
- 组件通过标准 A2UI `action` 机制回传事件，无需自定义 EventBus


---

## 6. A2UI 消息协议

本项目使用 **A2UI v0.8**（对应 `@a2ui/react` v0.8.0）。

### 6.1 消息格式

A2UI 消息是 **JSONL 格式**，每行一个完整 JSON 对象，天然流式友好。一次界面渲染通常包含三条消息：

```jsonl
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["canvas","controls"]}}}},{"id":"canvas","component":{"PhysicsOscillator":{}}},{"id":"controls","component":{"Row":{"children":{"explicitList":["amp-label","amp-slider"]}}}},{"id":"amp-label","component":{"Text":{"text":{"literalString":"振幅"}}}},{"id":"amp-slider","component":{"Slider":{"value":{"path":"/osc/amplitude"},"min":0,"max":10,"action":{"event":{"name":"param_update","context":{"amplitude":{"path":"/osc/amplitude"}}}}}}}]}}
{"dataModelUpdate":{"surfaceId":"main","contents":[{"key":"osc","valueMap":[{"key":"amplitude","valueNumber":5},{"key":"freq","valueNumber":2}]}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
```

### 6.2 关键消息类型（v0.8）

| 消息类型 | 作用 |
|---------|------|
| `surfaceUpdate` | 定义/更新组件树（扁平列表 + ID 引用） |
| `dataModelUpdate` | 更新数据模型，组件通过 `path` 绑定 |
| `beginRendering` | 触发渲染，指定根组件 ID |

### 6.3 SSE 流中的混合格式

后端 SSE 流中，普通文本和 A2UI JSONL 消息按行混合输出：

```
data: {"type":"text","content":"简谐运动是一种..."}
data: {"type":"text","content":"下面展示振幅为5的模拟："}
data: {"type":"a2ui","line":"{\"surfaceUpdate\":{...}}"}
data: {"type":"a2ui","line":"{\"dataModelUpdate\":{...}}"}
data: {"type":"a2ui","line":"{\"beginRendering\":{...}}"}
data: {"type":"done"}
```

> 后端用 `type` 字段区分内容类型，前端 `StreamSplitter` 根据此字段分流，无需自行检测 JSON。

---

## 7. 前后端接口定义

### POST /api/v1/chat

**请求体：**
```json
{
  "messages": [
    {"role": "user", "content": "展示振幅为5的简谐运动"}
  ],
  "session_id": "uuid-xxxx",
  "surface_id": "main"
}
```

**SSE 响应流：**
```
data: {"type": "text", "content": "简谐运动是..."}
data: {"type": "a2ui", "line": "{\"surfaceUpdate\":{...}}"}
data: {"type": "a2ui", "line": "{\"dataModelUpdate\":{...}}"}
data: {"type": "a2ui", "line": "{\"beginRendering\":{...}}"}
data: {"type": "text", "content": "如图所示..."}
data: {"type": "done"}
```

### GET /api/v1/plugins

返回所有插件 manifest，供前端参考（主要供后续管理界面使用；`CatalogRegistry` 是静态注册，不依赖此接口）。

```json
[
  {
    "id": "aha-physics-pro",
    "name": "高中物理插件",
    "capabilities": [
      {"component_id": "PhysicsOscillator", "name": "简谐运动模拟器"}
    ]
  }
]
```

---

## 8. 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| UI 渲染引擎 | **@a2ui/react**（vendor 本地库） | 已提供完整的 Provider/Renderer/Registry/Action 机制，无需自研 |
| 插件组件形态 | **React 组件**（静态导入） | 与 @a2ui/react 的 ComponentRegistry 直接兼容，比 Web Components 简单 |
| 流式协议 | **SSE** | LLM 输出天然单向，比 WebSocket 简单 |
| SSE 内容区分 | **后端 `type` 字段** | 明确区分 `text` / `a2ui` / `done`，前端无需猜测内容类型 |
| A2UI 版本 | **v0.8**（稳定版） | @a2ui/react 当前支持 v0.8，v0.9 React renderer 尚未支持 |
| 双向交互 | **A2UI 原生 action 机制** | onAction 回调已内置，无需自定义 EventBus |
| 意图路由初期 | **关键词匹配** | 快速实现；后期替换为嵌入模型只需改 intent_router.py |
| 状态管理 | **Zustand** | 轻量，管理对话历史和流式缓冲 |

---

## 9. 数据流全链路示例

以「展示振幅为 5 的简谐运动」为例：

```
① 用户输入
   └─ chatStore 追加消息 → POST /api/v1/chat

② 后端 intent_router
   └─ 「简谐运动」命中 aha-physics-pro 插件关键词

③ 后端 retriever
   └─ 并行检索本体库 + 物理插件库 → top-k 文档片段

④ 后端 prompt_builder
   └─ 组装 Prompt：检索片段 + A2UI 格式指令 + 可用组件（PhysicsOscillator + 标准组件）

⑤ 后端调用 LLM，流式输出
   └─ 文本行：「简谐运动是...下面展示模拟：」
   └─ A2UI JSONL 行（3条）：surfaceUpdate / dataModelUpdate / beginRendering

⑥ 后端 SSE 包装后透传
   └─ 每行包装为 data: {"type":"text",...} 或 data: {"type":"a2ui",...}

⑦ 前端 StreamSplitter 分流
   └─ text 行 → chatStore.appendText() → TextBubble 流式渲染
   └─ a2ui 行 → 解析 JSON → processMessages() → @a2ui/react 处理

⑧ @a2ui/react 渲染
   └─ surfaceUpdate：构建组件树（Column > PhysicsOscillator + Slider）
   └─ dataModelUpdate：设置 amplitude=5, freq=2
   └─ beginRendering：触发渲染，PhysicsOscillator 动画启动

⑨ 用户拖动 Slider 改振幅
   └─ A2UI Slider 内置 action，触发 A2UIProvider.onAction
   └─ useA2UIActions.handleAction 接收 {name:'param_update', context:{amplitude:3}}
   └─ chatStore.appendInteractionContext() + triggerFollowUp()
   └─ 再次 POST /api/v1/chat（回到 ② 循环）
```






