# PBL 后端架构实现方案

> 目标：在现有聊天、SSE、A2UI、插件能力之上，新增 Project-Based Learning（PBL）编排层，让 AhaTutor 从“能讲解和展示组件”升级为“围绕用户项目目标组织学习、测评、回溯和产物推进”的后端系统。

## 1. 架构定位

PBL 不应做成另一个孤立聊天模式，而应作为一层 **Learning Workflow 编排层** 接在当前后端能力之上。

现有链路：

```txt
用户消息
→ /api/v1/chat
→ build_system_prompt(plugin capabilities)
→ stream_chat()
→ text / a2ui / done SSE
→ 前端 TextBubble + A2UIRenderer
```

PBL 链路：

```txt
用户目标 / 节点动作 / A2UI action
→ LearningOrchestrator 读取 WorkflowState
→ 决定当前阶段：规划 / 测评 / 学习 / 复习 / 回溯 / 项目推进
→ 调用对应 Agent 或 Service
→ 复用 PromptBuilder + A2UIBuilder + SSE 输出
→ 更新 WorkflowState
```

核心原则：

- LLM 负责生成内容。
- 后端状态机负责流程推进。
- A2UI 继续作为教学组件输出协议。
- 插件继续作为学科知识和组件能力来源。
- PBL 状态必须可持久化、可恢复、可测试。

## 2. 推荐目录结构

```txt
backend/app/
├── routers/
│   ├── chat.py                  # 保留普通聊天 / A2UI SSE
│   ├── pbl.py                   # PBL 目标、节点动作、学习流接口
│   └── conversations.py
│
├── learning/
│   ├── schemas.py               # ProjectGoal, LearningNode, WorkflowState
│   ├── session_service.py       # PBL 会话读写与恢复
│   ├── tree_service.py          # 目标树生成、校验、状态计算
│   ├── mastery_service.py       # 掌握度测评、判定、状态迁移
│   └── project_bridge.py        # 学习节点到项目里程碑/产物推进
│
├── agents/
│   ├── base.py                  # 统一 Agent 接口
│   ├── goal_clarifier.py
│   ├── curriculum_architect.py
│   ├── assessment_designer.py
│   ├── mastery_judge.py
│   ├── tutor.py
│   ├── visualizer.py
│   └── integration.py
│
├── workflow/
│   ├── orchestrator.py          # LearningOrchestrator 核心编排器
│   ├── transitions.py           # 状态迁移规则
│   └── events.py                # 用户动作、组件动作、节点完成事件
│
├── orchestrator/
│   ├── prompt_builder.py        # 复用并扩展 PBL prompt 上下文
│   └── a2ui_builder.py          # 复用 A2UI JSONL / SSE 工具
│
└── models/
    ├── conversation.py
    ├── plugin.py
    └── learning.py              # 若需要 DB/ORM 模型，可放这里
```

## 3. 核心数据模型

第一版至少需要三个核心对象。

```python
class ProjectGoal(BaseModel):
    id: str
    raw_input: str
    title: str
    domains: list[str]
    artifact_type: str
    difficulty: str
    constraints: dict = {}
```

```python
class LearningNode(BaseModel):
    id: str
    goal_id: str
    parent_id: str | None = None
    title: str
    description: str
    children: list[str] = []
    prerequisites: list[str] = []
    mastery_criteria: list[str] = []
    estimated_difficulty: str
    status: Literal["unknown", "skipped", "review", "learning", "mastered"]
    component_hints: list[str] = []
    project_relevance: str
```

```python
class LearningWorkflowState(BaseModel):
    conversation_id: str
    goal: ProjectGoal
    knowledge_tree: list[LearningNode]
    current_node_id: str | None
    current_mode: Literal["planning", "assessment", "learning", "review", "building"]
    mastered_node_ids: list[str] = []
    weak_node_ids: list[str] = []
    skipped_node_ids: list[str] = []
    project_milestones: list[dict] = []
```

建议新增持久化表：

```txt
pbl_goals
pbl_nodes
pbl_workflow_states
pbl_assessments
pbl_events
```

其中 `pbl_events` 用于记录用户选择、测评提交、A2UI 交互、节点完成等事件。它对调试、会话恢复和学习画像都很重要。

## 4. API 设计

新增 `backend/app/routers/pbl.py`。

```txt
POST /api/v1/pbl/goals
创建项目目标，返回 goal + 初始 workflow_state。

POST /api/v1/pbl/goals/{goal_id}/tree
生成或重新生成 2-3 层知识树。

GET /api/v1/pbl/sessions/{conversation_id}/state
读取当前 PBL 状态，供前端恢复目标树、当前节点和掌握状态。

POST /api/v1/pbl/nodes/{node_id}/action
处理 mastered / review / assess / learn / complete 等节点动作。

POST /api/v1/pbl/chat
围绕当前节点进行教学，返回 text / a2ui / done SSE。

POST /api/v1/pbl/a2ui-action
处理组件交互回传，如滑块变化、测验选择、按钮动作。
```

`/chat` 继续服务自由对话；`/pbl/chat` 服务带状态的学习节点对话。两者底层应共用 SSE emitter 和 A2UI parser，避免协议分裂。

## 5. LearningOrchestrator 状态机

第一版不需要真正的多 Agent 自由协商。推荐使用一个确定性编排器，按状态调用窄职责 Agent。

```txt
planning
→ GoalClarifierAgent
→ CurriculumArchitectAgent

assessment
→ 用户自评
→ AssessmentDesignerAgent
→ MasteryJudgeAgent

learning
→ TutorAgent
→ VisualizerAgent
→ A2UIBuilder

review
→ IntegrationAgent
→ 回收子节点能力到父节点/根项目

building
→ ProjectBridgeAgent
→ 生成下一步项目产物建议
```

状态迁移示例：

```txt
unknown
→ 用户选择“我会” → mastered
→ 用户选择“有点忘” → review
→ 用户选择“不确定” → assessment
→ 用户选择“不会” → learning
→ 教学完成 + 练习通过 → mastered
→ 子节点全部 mastered → 父节点进入 review/building
```

## 6. Agent 职责边界

第一阶段建议保留 8 个 Agent。

| Agent | 职责 |
|---|---|
| `LearningOrchestrator` | 维护状态，决定下一步 |
| `GoalClarifierAgent` | 将自然语言目标转为结构化 ProjectGoal |
| `CurriculumArchitectAgent` | 生成 2-3 层 LearningNode 目标树 |
| `AssessmentDesignerAgent` | 为当前节点生成小测或开放题 |
| `MasteryJudgeAgent` | 根据用户答案判定掌握度 |
| `TutorAgent` | 围绕当前节点教学 |
| `VisualizerAgent` | 决定是否调用 A2UI 组件及使用哪个组件 |
| `IntegrationAgent` | 将子节点知识回收到父能力和项目目标 |

第二阶段再扩展：

- `MisconceptionDetectorAgent`
- `ProjectPlannerAgent`
- `CodeAssistantAgent`
- `ReflectionAgent`
- `MemoryAgent`

## 7. A2UI 与插件协作

现有 `prompt_builder.py` 已经会注入插件能力和 A2UI 输出规则。PBL 只需要额外注入学习上下文：

```txt
当前项目目标
当前学习节点
节点 mastery_criteria
用户自评或测评结果
推荐 component_hints
项目关联说明 project_relevance
```

示例：

```txt
当前节点：简谐运动
教学目标：让学生理解振幅、频率、阻尼如何影响运动
推荐组件：PhysicsOscillator
组件来源：插件能力表
输出要求：文本解释 + 必要时 A2UI v0.8 JSONL
```

`VisualizerAgent` 不直接硬编码组件 UI，而是根据 `LearningNode.component_hints`、插件 manifest capabilities、当前教学目标，决定是否向 LLM prompt 注入组件使用建议。

A2UI SSE 包装继续复用 `orchestrator/a2ui_builder.py`：

```txt
surfaceUpdate / dataModelUpdate / beginRendering
→ to_sse_event()
→ data: {"type": "a2ui", "line": "..."}
```

## 8. MVP 实施顺序

1. 新增 `learning/schemas.py`、`workflow/orchestrator.py`、`routers/pbl.py`。
2. 打通“用户目标 → 结构化 ProjectGoal → 目标树 LearningNode[]”。
3. 增加 PBL 状态持久化，让刷新后能恢复当前节点。
4. 实现节点动作：`mastered`、`review`、`assess`、`learn`。
5. 接入 `AssessmentDesignerAgent` 和 `MasteryJudgeAgent`，先输出结构化 JSON。
6. 扩展 PBL chat prompt，使 `/pbl/chat` 能围绕当前节点教学。
7. 复用 A2UI 输出能力，在教学中渲染可交互组件。
8. 实现 `IntegrationAgent` 和 `ProjectBridgeAgent`，完成子节点到父节点、学习到项目产物的回溯。

## 9. 测试策略

需要优先覆盖以下测试：

- `LearningNode` 状态迁移测试。
- 目标树结构测试：节点 ID 唯一，parent/children 一致，prerequisites 不指向不存在节点。
- PBL 状态恢复测试：同一 `conversation_id` 能恢复 `current_node_id` 和节点状态。
- SSE 协议回归：`/pbl/chat` 仍输出 `text / a2ui / done`。
- A2UI 解析回归：`surfaceUpdate / dataModelUpdate / beginRendering` 仍能正确包装。
- Agent 结构化输出测试：目标、目标树、测评题、掌握度判定必须能被 Pydantic 校验。

## 10. 主要风险

1. **LLM 自由决定流程会漂移**

   应由后端状态机决定状态，LLM 只生成当前状态需要的内容。

2. **PBL 状态和聊天历史混在一起会难以恢复**

   聊天消息继续保存在 messages；PBL 状态单独保存在 `pbl_*` 表。

3. **A2UI 组件调用可能变成装饰，而非教学策略**

   组件选择必须和 `mastery_criteria`、`component_hints`、`project_relevance` 绑定。

4. **第一版 Agent 太多会过度工程化**

   第一版 Agent 可以是普通 Python 类或函数，统一接口即可，不必上复杂多智能体运行时。

5. **目标树质量不可控**

   需要对 LLM 输出做 schema 校验、树结构校验和失败重试。

## 11. 结论

推荐采用：

```txt
现有 Chat/A2UI 流式能力
+ PBL Workflow 状态机
+ 持久化 LearningWorkflowState
+ 窄职责 Agent
+ 插件能力驱动的 Visualizer
```

这样可以最快形成闭环 MVP：用户输入项目目标，系统生成目标树，判断掌握度，进入节点教学，调用 A2UI 可视化组件，完成子节点后回溯到父节点，并最终推进真实项目产物。
