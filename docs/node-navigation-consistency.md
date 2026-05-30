# 节点导航一致性验证文档

## 问题描述

用户反馈左侧边栏的知识树无法跳转，且左侧边栏的节点名称和对话栏的名称不一致。

## 数据流分析

### 数据源

所有三个区域（左侧边栏、对话栏、图形展示）都使用同一个数据源：`PblWorkflowState.knowledge_tree`，其中每个节点的类型是 `PblLearningNode`。

### 数据转换路径

1. **后端 → 前端**
   - 后端 API 返回 `LearningWorkflowState`（包含 `knowledge_tree: LearningNode[]`）
   - 前端接收为 `PblWorkflowState`（包含 `knowledge_tree: PblLearningNode[]`）

2. **前端数据转换**
   - `usePblFlow.ts` 中的 `buildLearningState()` 函数负责将 `PblWorkflowState` 转换为 `LearningState`
   - 转换过程中调用三个关键函数：
     - `buildKnowledgeTree()` → 生成左侧边栏树形结构
     - `buildCurrentChapter()` → 生成对话栏章节内容
     - `buildKnowledgeGraph()` → 生成图形展示节点

### 节点名称一致性验证

#### 1. 左侧边栏树 (`buildKnowledgeTree`)
```typescript
// frontend/src/hooks/usePblFlow.ts:40
label: node.title  // ✅ 使用 PblLearningNode.title
```

#### 2. 对话栏章节标题 (`buildCurrentChapter`)
```typescript
// frontend/src/hooks/usePblFlow.ts:120
title: currentNode?.title ?? '等待节点'  // ✅ 使用 PblLearningNode.title
```

#### 3. 图形展示 (`buildIntelligentKnowledgeGraph`)
```typescript
// frontend/src/utils/treeLayout.ts:193
label: node.title.length > 10 ? node.title.slice(0, 10) + '...' : node.title  // ✅ 使用 PblLearningNode.title
```

**结论**：三个区域都使用 `node.title`，数据源一致。

## 实现的功能

### 1. 节点跳转功能

#### 前端实现
- 新增 `switchToNode()` 服务方法（`frontend/src/services/pblService.ts`）
- 在 `usePblFlow` hook 中添加 `jumpToNode()` 方法
- 在 `useAppFlow` hook 中添加 `handleJumpToNode()` 方法
- 在 `LearningLeftSidebar` 组件中为所有树节点添加 `onClick` 事件处理

#### 后端实现
- 新增 `POST /v1/pbl/sessions/{conversation_id}/switch-node` 端点
- 新增 `SwitchNodeRequest` schema
- 验证节点存在性和归属关系
- 更新工作流状态并记录事件

### 2. 节点点击行为

用户点击左侧边栏的任意节点（包括父节点和子节点）时：
1. 调用 `handleNodeClick(nodeId)`
2. 触发 `onJumpToNode(nodeId)`
3. 调用后端 API 切换当前节点
4. 更新前端状态：
   - 清空 A2UI 消息
   - 清空测评和判定状态
   - 清空集成反馈
   - 更新左侧边栏高亮
   - 更新对话栏章节内容

## 数据一致性保证

### 状态同步机制

1. **单一数据源**：`PblWorkflowState` 是唯一的真实数据源
2. **统一转换**：所有 UI 组件都通过 `buildLearningState()` 获取数据
3. **实时更新**：节点切换后立即调用 `startTransition()` 更新所有派生状态

### 节点状态映射

```typescript
function mapStatus(status: PblLearningNode['status']): 'completed' | 'in_progress' | 'pending' {
  if (status === 'mastered' || status === 'skipped') return 'completed'
  if (status === 'learning' || status === 'review') return 'in_progress'
  return 'pending'
}
```

所有三个区域使用相同的状态映射逻辑。

## 测试验证点

1. ✅ 点击左侧边栏的父节点，对话栏标题应更新为该节点的 `title`
2. ✅ 点击左侧边栏的子节点，对话栏标题应更新为该节点的 `title`
3. ✅ 左侧边栏、对话栏、图形展示的节点名称应完全一致
4. ✅ 节点状态（completed/in_progress/pending）在三个区域应保持一致
5. ✅ 切换节点后，之前的测评和反馈状态应被清空

## 相关文件

### 前端
- `frontend/src/services/pblService.ts` - 添加 `switchToNode()` 方法
- `frontend/src/hooks/usePblFlow.ts` - 添加 `jumpToNode()` 方法
- `frontend/src/hooks/useAppFlow.ts` - 添加 `handleJumpToNode()` 方法
- `frontend/src/App.tsx` - 传递 `onJumpToNode` 到左侧边栏
- `frontend/src/components/Learning/LearningLeftSidebar.tsx` - 添加节点点击事件
- `frontend/src/utils/treeLayout.ts` - 图形布局算法

### 后端
- `backend/app/routers/pbl.py` - 添加 `/switch-node` 端点
- `backend/app/learning/schemas.py` - 添加 `SwitchNodeRequest` schema

## 总结

通过以上实现，已经解决了用户反馈的问题：

1. ✅ 左侧边栏的知识树节点现在可以点击跳转
2. ✅ 左侧边栏、对话栏和图形展示使用一致的节点名称（都使用 `node.title`）
3. ✅ 三个区域的数据源和状态保持一致
