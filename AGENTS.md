# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

AhaTutor v2.0 - 项目当前处于初始设置阶段。

## 开发设置

项目结构尚未建立。添加文件和依赖项时，请遵循以下准则：

- 添加构建、测试和开发命令时进行文档记录
- 随着代码库的增长，更新此文件以记录架构决策和模式
- 包含任何特殊配置或环境设置要求

## 架构

详见 [design/architecture.md](design/architecture.md)。

### 目录结构

> 以下为大体参考，可根据实际情况调整。

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

## 开发原则

- **模块化设计**：项目开发过程中力求模块化，让每个模块可以单独重构 
- 保持模块之间的低耦合，高内聚
- 每个模块应有清晰的职责边界和接口定义
- **文档管理**：不要创建不必要的文档，仅在必要时创建文档并放置在 `docs/` 目录中
  - 每完成一个重要进度，创建一个文档记录，根据情况包括：问题分析、解决方案（干了什么）、经验总结

## 前端设计规范

详见 [temp/原型/DESIGN.md](temp/原型/DESIGN.md)，核心原则摘要如下：

### 创意方向：「The Illuminated Mind」
拒绝传统 EdTech 的仪表盘美学，采用**高端编辑排版**风格。大量留白、非对称布局、玻璃态分层，营造「阳光图书馆」的沉浸感，让 UI 消失，只留下知识的清晰呈现。

### 色彩体系
- **底色**：`surface` #faf9f5（暖奶油，非纯白）
- **分区层**：`surface-container-low` #f4f4f0
- **卡片层**：`surface-container-lowest` #ffffff（自然浮起）
- **主色**：`primary` #182544（深靛蓝）
- **强调色**：`secondary` #775a19（金色，仅用于「顿悟」瞬间）
- **禁用纯黑**：文字一律用 `on-surface` #1b1c1a

### 无边框规则
**禁止**使用 1px solid 边框分割区域，改用：
1. 背景色阶过渡
2. 色调分块
3. 负空间（间距 8 / 12 / 16）

### 玻璃态规则
浮层导航和模态框：`surface` 70% 透明度 + `backdrop-blur: 20px–40px`
高强度 CTA：`primary` → `primary-container` 135° 线性渐变

### 字体
- **对话内容（标题 + 正文）**：Newsreader（衬线，权威感）—— TextBubble 和 A2UI 组件统一使用
- **界面控件（导航、按钮、输入框、侧边栏）**：Manrope（无衬线，高可读性）
- 强调极端字号对比，用 `display-lg` 标题 + `body-md` 正文制造视觉焦点

### 阴影
浮层阴影：`0px 20px 40px rgba(27, 28, 26, 0.06)`（环境光感，非硬投影）
必须有边界时：`outline-variant` #c5c6cf at **15% opacity**（「幽灵边框」）

### 核心组件
- **主按钮**：全圆角 pill，靛蓝渐变
- **次按钮**：`surface-container-lowest` 背景 + 金色文字（用于「提示/深挖」）
- **Glass Card**：`surface` 80% + `backdrop-blur-xl` + `rounded-xl`，无分割线
- **进度组件**：SVG 流线曲线（金色），非线性进度条
- **输入框**：极简下划线，聚焦时边框变为金色

### Do / Don't
- ✅ 非对称布局（左标题，右正文偏移）
- ✅ 感觉拥挤时提升间距等级
- ✅ 金色只在学生「得出结论」时出现
- ❌ 不用 1px 线分隔列表项
- ❌ 不用纯黑 #000000
- ❌ 组件距视口边缘至少保留 `6`（2rem）内边距

---

## 重要说明

- 使用中文与用户对话

## 组件预览库 (Gallery)

访问 `http://localhost:5173/?gallery=1` 可查看所有已注册 A2UI 组件的样式预览。

- Gallery 位于 `frontend/src/gallery/`，通过 `A2UIRenderer` 真实渲染组件，与聊天页面共享同一套渲染管线
- 新增组件示例：在 `gallery/componentExamples.ts` 中添加 A2UI 消息序列，并在 `componentExamples` 数组中注册
- **样式覆盖必须写在全局 CSS（`index.css`）中**，这样才能同时作用于聊天页面和 Gallery。不要将 A2UI 组件的样式覆盖写在局部作用域（如组件内 `<style>` 或 CSS Modules）中，否则 Gallery 和主页面会出现不一致
