# PBL 后端下一步实施说明

> 面向后续执行者：这份文档不是产品愿景，而是开工清单。目标是在现有后端上实现 PBL 最小工作流骨架，为后续接入真实 Agent、A2UI 教学流和前端 PBL 页面打基础。

## 1. 本阶段目标

在不重构现有 `/chat`、插件系统、A2UI SSE 链路的前提下，新增 PBL 后端最小骨架：

```txt
用户输入项目目标
→ 后端创建 ProjectGoal
→ 生成或返回一棵 2-3 层 LearningNode 目标树
→ 保存 LearningWorkflowState
→ 可通过接口恢复当前 PBL 状态
→ 用户对节点执行 mastered / review / assess / learn / complete 动作
→ 后端正确更新节点状态和 current_mode
```

这一阶段重点是证明：**PBL 是一个可持久化、可恢复、可测试的学习工作流**。

## 2. 推荐改动范围

优先新增以下文件：

```txt
backend/app/learning/
├── __init__.py
├── schemas.py
├── session_service.py
└── tree_service.py

backend/app/workflow/
├── __init__.py
├── orchestrator.py
└── transitions.py

backend/app/routers/
└── pbl.py

backend/tests/
└── test_pbl_workflow.py
```

如需数据库持久化，可在现有 DB 初始化逻辑中新增 PBL 表。优先保持表结构简单，不引入新依赖。

建议表：

```txt
pbl_goals
pbl_nodes
pbl_workflow_states
pbl_events
```

## 3. 暂不处理的内容

本阶段刻意不做以下事情：

- 不重写现有 `/api/v1/chat`。
- 不重构 `prompt_builder.py`。
- 不重构 `a2ui_builder.py`。
- 不改插件注册和插件 manifest 规范。
- 不做复杂多 Agent 运行时。
- 不接真实 LLM 生成目标树，除非已有稳定服务可复用且测试可控。
- 不做完整前端 PBL UI。
- 不新增第三方依赖。

可以先用规则或固定 mock 生成目标树，把状态流打通。

## 4. API 骨架

新增 `backend/app/routers/pbl.py`。

### 4.1 创建 PBL 目标

```txt
POST /api/v1/pbl/goals
```

请求示例：

```json
{
  "raw_input": "我想做一个弹簧振子模拟器",
  "conversation_id": "optional-existing-conversation-id"
}
```

响应应包含：

```json
{
  "goal": {},
  "workflow_state": {}
}
```

### 4.2 生成目标树

```txt
POST /api/v1/pbl/goals/{goal_id}/tree
```

响应应包含：

```json
{
  "goal_id": "...",
  "nodes": []
}
```

### 4.3 获取会话状态

```txt
GET /api/v1/pbl/sessions/{conversation_id}/state
```

响应应返回当前 `LearningWorkflowState`。

### 4.4 节点动作

```txt
POST /api/v1/pbl/nodes/{node_id}/action
```

请求示例：

```json
{
  "conversation_id": "...",
  "action": "learn"
}
```

支持动作：

```txt
mastered
review
assess
learn
complete
skip
```

## 5. 状态迁移规则

建议先实现确定性状态迁移。

```txt
unknown + mastered → mastered, current_mode=planning 或 review
unknown + review   → review, current_mode=review
unknown + assess   → unknown, current_mode=assessment
unknown + learn    → learning, current_mode=learning
learning + complete → mastered, current_mode=review
review + complete   → mastered, current_mode=review
unknown + skip      → skipped, current_mode=planning
```

节点完成后，先不必实现复杂父节点自动完成。可以只做简单计算：

- 如果当前节点所有子节点都是 `mastered` 或 `skipped`，父节点可进入 `review`。
- 如果根节点所有子节点完成，`current_mode` 可进入 `building`。

## 6. 数据模型要求

在 `learning/schemas.py` 中定义：

```python
class ProjectGoal(BaseModel): ...
class LearningNode(BaseModel): ...
class LearningWorkflowState(BaseModel): ...
class NodeActionRequest(BaseModel): ...
```

要求：

- 所有外部 API 响应都走 Pydantic model。
- `LearningNode.status` 和 `LearningWorkflowState.current_mode` 使用 `Literal` 限制。
- 节点 ID 必须唯一。
- `parent_id`、`children`、`prerequisites` 不得指向不存在节点。

## 7. 实现注意事项

1. **优先复用现有结构**

   现有后端已经有 FastAPI router、SQLite DB、conversation 相关逻辑。PBL 应作为新增模块接入，不要推翻现有结构。

2. **不要破坏 `/chat`**

   现有聊天、A2UI、插件测试必须继续通过。本阶段新增 PBL，不改聊天主链路。

3. **状态机要确定**

   不要让 LLM 决定节点状态。节点状态由后端 `transitions.py` 决定。

4. **目标树生成可以先简单**

   第一版可以根据用户输入生成通用模板树，例如：

   ```txt
   根目标
   ├── 基础概念
   ├── 核心原理
   └── 项目实现
   ```

   后续再接 `CurriculumArchitectAgent`。

5. **事件要记录**

   每次节点动作都应记录到 `pbl_events` 或等价结构中，至少包含：

   ```txt
   id, conversation_id, node_id, event_type, payload, created_at
   ```

6. **避免过度抽象**

   第一版的 Agent 可以不出现，或者只保留接口占位。不要为了未来多 Agent 系统提前堆复杂框架。

7. **错误要明确**

   - conversation 不存在：404
   - goal 不存在：404
   - node 不存在：404
   - action 不支持：422 或 400
   - 状态恢复失败：明确返回错误，不静默创建新状态

## 8. 验收标准

本阶段完成时必须满足：

1. `POST /api/v1/pbl/goals` 可以创建 PBL 目标和初始 workflow state。
2. `POST /api/v1/pbl/goals/{goal_id}/tree` 可以生成至少 2 层目标树。
3. `GET /api/v1/pbl/sessions/{conversation_id}/state` 可以恢复当前 PBL 状态。
4. `POST /api/v1/pbl/nodes/{node_id}/action` 可以正确处理：
   - `mastered`
   - `review`
   - `assess`
   - `learn`
   - `complete`
   - `skip`
5. 节点动作会更新：
   - 节点 `status`
   - workflow `current_node_id`
   - workflow `current_mode`
   - mastered / weak / skipped 列表
6. 每次节点动作有事件记录。
7. 目标树结构通过校验：
   - ID 唯一
   - parent/children 一致
   - prerequisites 合法
8. 新增测试覆盖 PBL 目标创建、树生成、状态恢复、节点动作迁移。
9. 现有后端测试仍通过，尤其是：
   - plugins API
   - prompt builder
   - visualization decision
10. 不新增依赖，不破坏现有 `/chat` SSE 输出格式。

## 9. 推荐测试命令

在 `backend` 目录运行：

```txt
python -m pytest
```

如果当前项目已有其他测试入口，以现有 README 或 package scripts 为准。

## 10. 完成后的下一阶段

本阶段完成后，下一阶段再做：

1. `CurriculumArchitectAgent`：用 LLM 生成真实目标树。
2. `AssessmentDesignerAgent`：为节点生成测评题。
3. `MasteryJudgeAgent`：根据回答判断掌握度。
4. `/api/v1/pbl/chat`：围绕当前节点输出教学 SSE。
5. `VisualizerAgent`：结合插件能力和 A2UI 输出交互式教学组件。
6. 前端 PBL 页面接入真实后端状态。
