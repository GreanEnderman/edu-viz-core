# Phase 4: 前端配合接通 - 状态检查

## 已完成的功能 ✅

### 1. 目标输入后，显示 GoalClarifierAgent 结果 ✅
- **后端**: `POST /v1/pbl/goals` → GoalClarifierAgent
- **前端**: `createPblGoal()` 在 `pblService.ts`
- **状态**: ✅ 已接通
- **数据流**: 用户输入 → GoalClarifierAgent → 返回 `GoalCreatedResponse` (包含 goal 和 workflow_state)
- **前端展示**: `planningData` 中包含项目标题、领域、难度等信息

### 2. 规划页展示 CurriculumArchitectAgent 生成树 ✅
- **后端**: `POST /v1/pbl/goals/{goalId}/tree` → CurriculumArchitectAgent
- **前端**: `generatePblTree()` 在 `pblService.ts`
- **状态**: ✅ 已接通
- **数据流**: goalId → CurriculumArchitectAgent → 返回 `TreeResponse` (包含 nodes 和 workflow_state)
- **前端展示**: `PlanningScreen` 显示知识图谱 (`knowledgeGraph`)

### 3. 点"不会"后进入 TutorAgent 教学流 ✅
- **后端**: 
  - `POST /v1/pbl/nodes/{nodeId}/action` (action=learn)
  - `POST /v1/pbl/chat` → TutorOrchestrator → TutorAgent
- **前端**: 
  - `applyPblNodeAction()` 在 `pblService.ts`
  - `streamPblChat()` 在 `pblService.ts`
  - `handlePrerequisiteSelect()` 在 `useAppFlow.ts`
- **状态**: ✅ 已接通
- **数据流**: 点击"不会" → action=learn → 自动发送学习请求 → TutorAgent 流式返回教学内容
- **前端展示**: `ChapterContent` 显示流式教学内容

### 4. 适合可视化时显示 VisualizerAgent 驱动的提示 ✅
- **后端**: TutorOrchestrator 自动调用 VisualizerAgent
- **前端**: `streamPblChat()` 接收流式响应，包含可视化提示
- **状态**: ✅ 已接通（提示文本）
- **数据流**: TutorAgent 判断 should_visualize=true → VisualizerAgent → 流式输出可视化提示
- **前端展示**: 教学内容中显示 "💡 **可视化建议**: ..."
- **注意**: A2UI 组件的自动生成尚未实现（需要 A2UIGenerator）

---

## 需要补充的功能 ❌

### 5. 点"不确定"后显示 AssessmentDesignerAgent 题目 ❌
- **后端**: `POST /v1/pbl/nodes/{nodeId}/assessment` → AssessmentDesignerAgent ✅ 已实现
- **前端**: ❌ **缺少 API 调用**
- **状态**: ❌ 未接通
- **需要补充**:
  1. 在 `pblService.ts` 中添加 `generateAssessment()` 函数
  2. 在 `useAppFlow.ts` 的 `handlePrerequisiteSelect()` 中调用
  3. 创建测评题展示组件（如 `AssessmentQuestions.tsx`）
  4. 在 `LearningScreen` 中显示测评题

### 6. 提交答案后显示 MasteryJudgeAgent 判定 ❌
- **后端**: `POST /v1/pbl/assessments/{assessmentId}/submit` → MasteryJudgeAgent ✅ 已实现
- **前端**: ❌ **缺少 API 调用**
- **状态**: ❌ 未接通
- **需要补充**:
  1. 在 `pblService.ts` 中添加 `submitAssessment()` 函数
  2. 创建答案提交组件（如 `AssessmentSubmit.tsx`）
  3. 创建判定结果展示组件（如 `MasteryJudgment.tsx`）
  4. 显示分数、薄弱点、建议等信息

### 7. 节点完成后显示 IntegrationService 的反馈 ❌
- **后端**: IntegrationService 在 `apply_action()` 中生成反馈 ✅ 已实现
- **前端**: ❌ **缺少展示逻辑**
- **状态**: ❌ 未接通
- **需要补充**:
  1. 后端需要在 API 响应中返回 integration_feedback
  2. 前端需要监听 `node_integrated` 事件或从 workflow_state 中获取反馈
  3. 创建集成反馈展示组件（如 `IntegrationFeedback.tsx`）
  4. 显示总结、项目应用、下一步建议、进度等信息

---

## 总结

### 已完成 (4/7)
1. ✅ GoalClarifierAgent 结果展示
2. ✅ CurriculumArchitectAgent 生成树展示
3. ✅ TutorAgent 教学流
4. ✅ VisualizerAgent 提示（文本形式）

### 需要补充 (3/7)
5. ❌ AssessmentDesignerAgent 题目展示
6. ❌ MasteryJudgeAgent 判定展示
7. ❌ IntegrationService 反馈展示

---

## 优先级建议

### 高优先级
- **AssessmentDesignerAgent 题目展示** - 用户点击"不确定"后需要看到测评题
- **MasteryJudgeAgent 判定展示** - 用户提交答案后需要看到判定结果

### 中优先级
- **IntegrationService 反馈展示** - 节点完成后的反馈能增强学习体验

### 低优先级
- **VisualizerAgent 的 A2UI 自动生成** - 当前已有文本提示，A2UI 组件可以后续增强
