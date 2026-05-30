import { useCallback, useState } from 'react'
import type { AppState, ReflectionPrompt, PrerequisiteLevel } from '../types/appFlow'
import type { PblNodeAction } from '../types/pbl'
import { usePblFlow } from './usePblFlow'

function inferAppState(hasNodes: boolean, mode?: string): AppState {
  if (!hasNodes) return 'welcome'
  if (mode === 'planning') return 'planning'
  return 'learning'
}

export function useAppFlow() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [reflectionPrompt, setReflectionPrompt] = useState<ReflectionPrompt | null>(null)
  const [showCompleteButton, setShowCompleteButton] = useState(false)

  const {
    workflowState,
    planningData,
    learningData,
    a2uiLines,
    error,
    isStreaming,
    currentAssessment,
    currentJudgment,
    integrationFeedback,
    setShowPrerequisiteCheck,
    startProject,
    actOnCurrentNode,
    sendLearningMessage,
    startAssessment,
    submitAssessmentAnswers,
    clearAssessment,
    clearIntegrationFeedback,
    jumpToNode,
    restoreConversation,
  } = usePblFlow()

  const startPlanning = useCallback(async (projectTitle: string) => {
    setAppState('planning')
    await startProject(projectTitle)
  }, [startProject])

  const markCurrentNodeLearning = useCallback(async () => {
    setAppState('learning')
    setShowPrerequisiteCheck(true)
    await actOnCurrentNode('learn', true)
  }, [actOnCurrentNode, setShowPrerequisiteCheck])

  const showReflection = useCallback((prompt: ReflectionPrompt) => {
    setReflectionPrompt(prompt)
    setAppState('reflection')
  }, [])

  const continueLearn = useCallback(() => {
    setReflectionPrompt(null)
    setAppState('learning')
  }, [])

  const viewParentConcept = useCallback(() => {
    setReflectionPrompt(null)
    setAppState('learning')
  }, [])

  const backToWelcome = useCallback(() => {
    setAppState('welcome')
    setReflectionPrompt(null)
  }, [])

  const handleLearningMessage = useCallback(async (message: string) => {
    if (appState === 'learning' || appState === 'reflection') {
      await sendLearningMessage(message)
    }
  }, [appState, sendLearningMessage])

  const handlePrerequisiteSelect = useCallback(async (level: PrerequisiteLevel) => {
    setShowPrerequisiteCheck(false)

    const actionMap: Record<PrerequisiteLevel, PblNodeAction> = {
      master: 'assess',
      familiar: 'review',
      uncertain: 'assess',
      unfamiliar: 'learn',
    }

    const action = actionMap[level]
    await actOnCurrentNode(action, false)

    if (level === 'unfamiliar' || level === 'familiar') {
      const message =
        level === 'unfamiliar'
          ? '我对这个概念还不太熟，能详细讲解一下吗？'
          : '我有点忘了，能帮我复习一下吗？'
      await sendLearningMessage(message)
      setShowCompleteButton(true)
    }

    if (level === 'master' || level === 'uncertain') {
      await startAssessment()
      setShowCompleteButton(false)
    }
  }, [actOnCurrentNode, sendLearningMessage, setShowPrerequisiteCheck, startAssessment])

  const handleAssessmentSubmit = useCallback(async (answers: string[]) => {
    await submitAssessmentAnswers(answers)
  }, [submitAssessmentAnswers])

  const handleJudgmentContinue = useCallback(() => {
    clearAssessment()
    setShowPrerequisiteCheck(false)

    if (currentJudgment && currentJudgment.attempt.status !== 'mastered') {
      setShowCompleteButton(true)
      const message =
        currentJudgment.attempt.status === 'review'
          ? '我需要复习一下这个概念。'
          : '我需要学习这个概念。'
      void sendLearningMessage(message)
      return
    }

    setShowCompleteButton(false)
  }, [clearAssessment, currentJudgment, sendLearningMessage, setShowPrerequisiteCheck])

  const handleIntegrationContinue = useCallback(() => {
    clearIntegrationFeedback()
  }, [clearIntegrationFeedback])

  const handleCompleteCurrentNode = useCallback(async () => {
    await actOnCurrentNode('complete', true)
    setShowCompleteButton(false)
  }, [actOnCurrentNode])

  const handleJumpToNode = useCallback(async (nodeId: string) => {
    await jumpToNode(nodeId, true)
    setShowCompleteButton(false)
    setReflectionPrompt(null)
  }, [jumpToNode])

  const restoreProjectConversation = useCallback(
    async (conversationId: string, nodeId?: string | null) => {
      const restoredState = await restoreConversation(conversationId, nodeId, false)
      setAppState(inferAppState(restoredState.knowledge_tree.length > 0, restoredState.current_mode))
      setShowCompleteButton(false)
      setReflectionPrompt(null)
    },
    [restoreConversation]
  )

  return {
    appState,
    workflowState,
    planningData,
    learningData,
    a2uiLines,
    reflectionPrompt,
    error,
    isStreaming,
    currentAssessment,
    currentJudgment,
    integrationFeedback,
    showCompleteButton,
    startPlanning,
    showReflection,
    continueLearn,
    viewParentConcept,
    backToWelcome,
    handleLearningMessage,
    markCurrentNodeLearning,
    handlePrerequisiteSelect,
    handleAssessmentSubmit,
    handleJudgmentContinue,
    handleIntegrationContinue,
    handleCompleteCurrentNode,
    handleJumpToNode,
    restoreProjectConversation,
  }
}
