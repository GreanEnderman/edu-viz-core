import { startTransition, useEffect, useState } from 'react'
import type {
  AdvancementStep,
  Chapter,
  KnowledgeNode,
  KnowledgeTreeNode,
  LearningState,
  PlanningState,
  ReflectionQuestion,
  SystemProcess,
} from '../types/appFlow'
import type {
  Assessment,
  JudgmentResponse,
  NodeActionResponse,
  PblLearningNode,
  PblNodeAction,
  PblNodeStatus,
  PblWorkflowState,
} from '../types/pbl'
import {
  applyPblNodeAction,
  createPblGoal,
  generateAssessment,
  generatePblTree,
  getPblState,
  streamPblChat,
  submitAssessment,
  switchToNode,
} from '../services/pblService'
import { remapSurfaceId } from '../a2ui-engine/StreamSplitter'
import { buildIntelligentKnowledgeGraph } from '../utils/treeLayout'

const PLANNING_PROCESSES: SystemProcess[] = [
  { id: 'goal', label: '解析项目目标', status: 'completed', description: '已创建 PBL 目标' },
  { id: 'tree', label: '生成学习树', status: 'completed', description: '已生成 2-3 层学习节点' },
  { id: 'state', label: '恢复学习状态', status: 'completed', description: '工作流状态已同步' },
  { id: 'ready', label: '准备进入教学', status: 'in_progress', description: '正在选择当前节点' },
]

function mapStatus(status: PblLearningNode['status']): 'completed' | 'in_progress' | 'pending' {
  if (status === 'mastered' || status === 'skipped') return 'completed'
  if (status === 'learning' || status === 'review') return 'in_progress'
  return 'pending'
}

function buildKnowledgeGraph(nodes: PblLearningNode[]): KnowledgeNode[] {
  return buildIntelligentKnowledgeGraph(nodes)
}

function buildKnowledgeTree(
  nodes: PblLearningNode[],
  parentId: string | null = null,
  currentNodeId?: string | null
): KnowledgeTreeNode[] {
  return nodes
    .filter((node) => node.parent_id === parentId)
    .map((node) => {
      const children = buildKnowledgeTree(nodes, node.id, currentNodeId)
      // 判断是否有子节点正在学习或复习
      const hasActiveChild = children.some(
        (child) => child.status === 'in_progress' || child.isExpanded
      )

      return {
        id: node.id,
        label: node.title,
        status: mapStatus(node.status),
        // 展开条件：根节点、当前正在学习/复习的节点、或有活跃子节点的节点
        isExpanded:
          node.parent_id === null ||
          node.status === 'learning' ||
          node.status === 'review' ||
          hasActiveChild,
        children,
      }
    })
}

function buildPlanningState(state: PblWorkflowState): PlanningState {
  return {
    projectId: state.goal.id,
    projectTitle: state.goal.title,
    projectDescription: state.goal.raw_input,
    tags: state.goal.domains,
    knowledgeGraph: buildKnowledgeGraph(state.knowledge_tree),
    systemProcesses: PLANNING_PROCESSES.map((process, index) => ({
      ...process,
      status:
        index === PLANNING_PROCESSES.length - 1 && state.current_node_id
          ? 'completed'
          : process.status,
    })),
    suggestions: [
      {
        id: 'pbl-suggestion',
        title: '当前建议',
        content:
          state.current_mode === 'planning'
            ? '先从当前激活节点开始，逐步把目标拆解成可学习、可验证的能力。'
            : `当前流程模式为 ${state.current_mode}，建议围绕当前节点继续推进。`,
      },
    ],
    contextualMemory: [
      {
        id: 'pbl-memory',
        content: `当前会话 ID：${state.conversation_id}`,
        source: 'PBL 状态',
      },
    ],
    progress: Math.round(
      ((state.mastered_node_ids.length + state.skipped_node_ids.length) /
        Math.max(state.knowledge_tree.length, 1)) *
        100
    ),
  }
}

function buildDomainProgress(state: PblWorkflowState): LearningState['domainProgress'] {
  const domains = state.goal.domains.length > 0 ? state.goal.domains : ['general']
  const progress = Math.round(
    ((state.mastered_node_ids.length + state.skipped_node_ids.length) /
      Math.max(state.knowledge_tree.length, 1)) *
      100
  )
  return domains.map((domain) => ({ domain, progress }))
}

function buildProjectAdvancement(state: PblWorkflowState): AdvancementStep[] {
  const fallbackSteps = [
    '理解核心原理',
    '完成当前节点',
    '推进项目实现',
    '形成最小可行成果',
  ]

  const milestones =
    state.project_milestones.length > 0
      ? state.project_milestones
      : fallbackSteps.map((title, index) => ({
          node_id: `fallback-${index}`,
          title,
          status: index === 0 ? 'learning' : 'unknown',
        }))

  return milestones.map((milestone) => ({
    id: milestone.node_id,
    label: milestone.title,
    status: mapStatus(milestone.status as PblNodeStatus),
    description:
      milestone.status === 'mastered'
        ? '已完成'
        : milestone.status === 'learning'
        ? '进行中'
        : '待推进',
  }))
}

function buildReflectionQuestions(currentNode: PblLearningNode | null): ReflectionQuestion[] {
  if (!currentNode) return []
  return currentNode.mastery_criteria.map((criterion, index) => ({
    id: `${currentNode.id}-reflection-${index}`,
    question: `你能用自己的话解释：${criterion}？`,
    answer: '请根据你的理解回答这个问题。',
  }))
}

function buildCurrentChapter(state: PblWorkflowState, showPrerequisiteCheck = true): Chapter {
  const currentNode =
    state.knowledge_tree.find((node) => node.id === state.current_node_id) ?? state.knowledge_tree[0]

  // 如果当前模式是 building，不显示前置知识检查
  const shouldShowPrerequisiteCheck = state.current_mode === 'building' ? false : showPrerequisiteCheck

  return {
    id: currentNode?.id ?? 'no-node',
    title: currentNode?.title ?? '等待节点',
    path: {
      domain: state.goal.domains[0] ?? 'PBL',
      category: '项目式学习',
      topic: state.goal.title,
      chapter: currentNode?.title ?? '等待节点',
    },
    content: currentNode
      ? `### 当前节点说明\n\n${currentNode.description}\n\n### 这一步为什么重要\n\n${currentNode.project_relevance}`
      : '当前还没有激活节点。',
    showPrerequisiteCheck: shouldShowPrerequisiteCheck,
    prerequisiteCheck: currentNode
      ? {
          question: `关于「${currentNode.title}」，你现在的感觉更接近哪一种？`,
          options: [
            { level: 'master', label: '我会' },
            { level: 'familiar', label: '有点忘' },
            { level: 'uncertain', label: '不确定' },
            { level: 'unfamiliar', label: '不会' },
          ],
        }
      : undefined,
    unlockMessage: currentNode ? `当前模式：${state.current_mode}` : undefined,
  }
}

function buildLearningState(
  state: PblWorkflowState,
  contentOverride?: string,
  showPrerequisiteCheck = true
): LearningState {
  const currentNode = state.knowledge_tree.find((node) => node.id === state.current_node_id) ?? null
  const baseChapter = buildCurrentChapter(state, showPrerequisiteCheck)

  return {
    projectId: state.goal.id,
    projectTitle: state.goal.title,
    projectDescription: state.goal.raw_input,
    tags: state.goal.domains,
    domainProgress: buildDomainProgress(state),
    currentChapter: {
      ...baseChapter,
      content: contentOverride ?? baseChapter.content,
    },
    knowledgeTree: buildKnowledgeTree(state.knowledge_tree, null, state.current_node_id),
    projectAdvancement: buildProjectAdvancement(state),
    currentArtifact: currentNode
      ? {
          id: `${currentNode.id}-artifact`,
          type: 'note',
          title: 'CURRENT NODE',
          content: currentNode.mastery_criteria.join('\n') || currentNode.description,
        }
      : null,
    reflectionQuestions: buildReflectionQuestions(currentNode),
    helpText: currentNode?.project_relevance ?? '当前节点完成后，会帮助你继续推进项目目标。',
  }
}

export function usePblFlow() {
  const [workflowState, setWorkflowState] = useState<PblWorkflowState | null>(null)
  const [planningData, setPlanningData] = useState<PlanningState | null>(null)
  const [learningData, setLearningData] = useState<LearningState | null>(null)
  const [showPrerequisiteCheck, setShowPrerequisiteCheck] = useState(true)
  const [a2uiLines, setA2uiLines] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [currentJudgment, setCurrentJudgment] = useState<JudgmentResponse | null>(null)
  const [integrationFeedback, setIntegrationFeedback] =
    useState<NodeActionResponse['integration_feedback'] | null>(null)

  useEffect(() => {
    if (!workflowState) return
    setLearningData((previous) =>
      buildLearningState(
        workflowState,
        previous?.currentChapter.id === workflowState.current_node_id
          ? previous.currentChapter.content
          : undefined,
        showPrerequisiteCheck
      )
    )
  }, [workflowState, showPrerequisiteCheck])

  const syncState = async (conversationId: string) => {
    const nextState = await getPblState(conversationId)
    startTransition(() => {
      setWorkflowState(nextState)
      setPlanningData(buildPlanningState(nextState))
      setLearningData(buildLearningState(nextState, undefined, showPrerequisiteCheck))
      setA2uiLines([])
    })
    return nextState
  }

  const startProject = async (projectTitle: string) => {
    setError(null)
    setWorkflowState(null)
    setPlanningData(null)
    setLearningData(null)
    setShowPrerequisiteCheck(true)
    setA2uiLines([])
    setCurrentAssessment(null)
    setCurrentJudgment(null)
    setIntegrationFeedback(null)

    const created = await createPblGoal({ raw_input: projectTitle })
    await generatePblTree(created.goal.id)
    return syncState(created.goal.conversation_id)
  }

  const actOnCurrentNode = async (
    action: PblNodeAction,
    prerequisiteVisibility = showPrerequisiteCheck
  ) => {
    if (!workflowState?.current_node_id) return null

    const response = await applyPblNodeAction(
      workflowState.current_node_id,
      workflowState.conversation_id,
      action
    )

    startTransition(() => {
      setShowPrerequisiteCheck(prerequisiteVisibility)
      setWorkflowState(response.workflow_state)
      setPlanningData(buildPlanningState(response.workflow_state))
      setLearningData(
        buildLearningState(response.workflow_state, undefined, prerequisiteVisibility)
      )
      setA2uiLines([])
      if (response.integration_feedback) {
        setIntegrationFeedback(response.integration_feedback)
      }
    })

    // 如果操作后进入 building 模式，自动生成构建指导
    if (response.workflow_state.current_mode === 'building') {
      await sendLearningMessage('请为我生成这个节点的构建指导。')
    }

    return response.workflow_state
  }

  const sendLearningMessage = async (message: string) => {
    if (!workflowState) return
    setA2uiLines([])
    setIsStreaming(true)
    let streamedContent = ''

    await streamPblChat(
      workflowState.conversation_id,
      [{ role: 'user', content: message }],
      {
        onChunk: (chunk) => {
          streamedContent += chunk
          setLearningData((previous) => {
            if (!previous) return previous
            return {
              ...previous,
              currentChapter: {
                ...previous.currentChapter,
                content: streamedContent,
              },
            }
          })
        },
        onA2UILine: (line) => {
          setA2uiLines((previous) => [...previous, remapSurfaceId(line, 'pbl-learning')])
        },
        onTitle: () => {},
        onDone: () => {
          setIsStreaming(false)
        },
        onError: (streamError) => {
          setIsStreaming(false)
          setError(streamError.message)
        },
      }
    )
  }

  const startAssessment = async () => {
    if (!workflowState?.current_node_id) return
    setError(null)
    try {
      const response = await generateAssessment(
        workflowState.current_node_id,
        workflowState.conversation_id
      )
      setCurrentAssessment(response.assessment)
      setCurrentJudgment(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成测评失败')
    }
  }

  const submitAssessmentAnswers = async (answers: string[]) => {
    if (!currentAssessment || !workflowState) return
    setError(null)
    try {
      const response = await submitAssessment(
        currentAssessment.id,
        workflowState.conversation_id,
        answers
      )
      setCurrentJudgment(response)
      setCurrentAssessment(null)
      startTransition(() => {
        setWorkflowState(response.workflow_state)
        setPlanningData(buildPlanningState(response.workflow_state))
        setLearningData(buildLearningState(response.workflow_state, undefined, showPrerequisiteCheck))
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交答案失败')
    }
  }

  const clearAssessment = () => {
    setCurrentAssessment(null)
    setCurrentJudgment(null)
  }

  const clearIntegrationFeedback = () => {
    setIntegrationFeedback(null)
  }

  const jumpToNode = async (
    nodeId: string,
    prerequisiteVisibility = true
  ) => {
    if (!workflowState) return
    setError(null)
    try {
      const nextState = await switchToNode(nodeId, workflowState.conversation_id)
      startTransition(() => {
        setShowPrerequisiteCheck(prerequisiteVisibility)
        setWorkflowState(nextState)
        setPlanningData(buildPlanningState(nextState))
        setLearningData(buildLearningState(nextState, undefined, prerequisiteVisibility))
        setA2uiLines([])
        setCurrentAssessment(null)
        setCurrentJudgment(null)
        setIntegrationFeedback(null)
      })

      // 如果切换到的节点是 building 模式，自动生成构建指导
      if (nextState.current_mode === 'building') {
        await sendLearningMessage('请为我生成这个节点的构建指导。')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换节点失败')
    }
  }

  const restoreConversation = async (
    conversationId: string,
    nodeId?: string | null,
    prerequisiteVisibility = false
  ) => {
    setError(null)
    const restoredState = await syncState(conversationId)
    const targetNodeId = nodeId ?? restoredState.current_node_id

    if (targetNodeId && targetNodeId !== restoredState.current_node_id) {
      await jumpToNode(targetNodeId, prerequisiteVisibility)
      return await getPblState(conversationId)
    }

    startTransition(() => {
      setShowPrerequisiteCheck(prerequisiteVisibility)
      setWorkflowState(restoredState)
      setPlanningData(buildPlanningState(restoredState))
      setLearningData(buildLearningState(restoredState, undefined, prerequisiteVisibility))
      setA2uiLines([])
      setCurrentAssessment(null)
      setCurrentJudgment(null)
      setIntegrationFeedback(null)
    })
    return restoredState
  }

  return {
    workflowState,
    planningData,
    learningData,
    a2uiLines,
    error,
    isStreaming,
    currentAssessment,
    currentJudgment,
    integrationFeedback,
    showPrerequisiteCheck,
    setShowPrerequisiteCheck,
    startProject,
    syncState,
    actOnCurrentNode,
    sendLearningMessage,
    startAssessment,
    submitAssessmentAnswers,
    clearAssessment,
    clearIntegrationFeedback,
    jumpToNode,
    restoreConversation,
  }
}
