import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useChatStore } from '../store/chatStore'
import { useAppFlow } from '../hooks/useAppFlow'
import { ComponentGallery } from '../gallery'
import { KnowledgeGraphDebug } from '../debug/KnowledgeGraphDebug'
import { TopNav } from './Layout/TopNav'
import { LeftSidebar } from './Layout/LeftSidebar'
import { RightSidebar } from './Layout/RightSidebar'
import { BackgroundDecoration } from './Layout/BackgroundDecoration'
import { LearningLeftSidebar } from './Learning/LearningLeftSidebar'
import { LearningRightSidebar } from './Learning/LearningRightSidebar'
import { WelcomeScreen } from './Welcome/WelcomeScreen'
import { PlanningScreen } from './Planning/PlanningScreen'
import { LearningScreen } from './Learning/LearningScreen'
import { BottomInput } from './Welcome/BottomInput'

export function AppShell() {
  const urlParams = new URLSearchParams(window.location.search)
  const isGalleryMode = urlParams.get('gallery') === '1'
  if (isGalleryMode) return <ComponentGallery />

  const isDebugMode = urlParams.get('debug') === 'graph'
  if (isDebugMode) return <KnowledgeGraphDebug />

  const [searchParams, setSearchParams] = useSearchParams()
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  const {
    appState,
    workflowState,
    planningData,
    learningData,
    a2uiLines,
    reflectionPrompt,
    error,
    currentAssessment,
    currentJudgment,
    integrationFeedback,
    showCompleteButton,
    startPlanning,
    handleLearningMessage,
    markCurrentNodeLearning,
    continueLearn,
    viewParentConcept,
    backToWelcome,
    handlePrerequisiteSelect,
    handleAssessmentSubmit,
    handleJudgmentContinue,
    handleIntegrationContinue,
    handleCompleteCurrentNode,
    handleJumpToNode,
    restoreProjectConversation,
  } = useAppFlow()

  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    const nodeId = searchParams.get('node')

    if (!conversationId || !nodeId) return

    void loadConversationAndSwitchNode(conversationId, nodeId)
    setSearchParams({})
  }, [searchParams, setSearchParams])

  const loadConversationAndSwitchNode = async (conversationId: string, nodeId: string) => {
    try {
      await useChatStore.getState().switchConversation(conversationId)
      await restoreProjectConversation(conversationId, nodeId)
    } catch (navigationError) {
      console.error('Failed to navigate to node:', navigationError)
    }
  }

  const renderMainContent = () => {
    switch (appState) {
      case 'welcome':
        return (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <WelcomeScreen onSelectProject={startPlanning} />
          </motion.div>
        )
      case 'planning':
        return (
          <motion.div
            key="planning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <PlanningScreen data={planningData} onComplete={markCurrentNodeLearning} />
          </motion.div>
        )
      case 'learning':
      case 'reflection':
        return (
          <motion.div
            key={`learning-${appState}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.34, ease: 'easeOut' }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <LearningScreen
              data={learningData}
              a2uiLines={a2uiLines}
              state={appState}
              reflectionPrompt={reflectionPrompt}
              currentAssessment={currentAssessment}
              currentJudgment={currentJudgment}
              integrationFeedback={integrationFeedback ?? undefined}
              onViewParent={viewParentConcept}
              onContinue={continueLearn}
              onPrerequisiteSelect={handlePrerequisiteSelect}
              onAssessmentSubmit={handleAssessmentSubmit}
              onJudgmentContinue={handleJudgmentContinue}
              onIntegrationContinue={handleIntegrationContinue}
            />
          </motion.div>
        )
      default:
        return null
    }
  }

  const handleSendMessage = (message: string) => {
    if (appState === 'welcome') {
      void startPlanning(message)
      return
    }

    if (appState === 'planning') {
      void markCurrentNodeLearning()
      return
    }

    void handleLearningMessage(message)
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background text-on-surface">
      <BackgroundDecoration />

      <TopNav
        onToggleLeft={() => setLeftOpen(!leftOpen)}
        onToggleRight={() => setRightOpen(!rightOpen)}
        appState={appState}
        projectTitle={planningData?.projectTitle || learningData?.projectTitle}
        progress={0}
      />

      <div className="relative z-10 flex h-[calc(100vh-72px)] overflow-hidden rounded-[16px] rounded-tr-none bg-[#fffdf9] shadow-sm">
        {appState === 'learning' || appState === 'reflection' ? (
          learningData && (
            <LearningLeftSidebar
              data={learningData}
              onBackToWelcome={backToWelcome}
              onJumpToNode={handleJumpToNode}
            />
          )
        ) : (
          <LeftSidebar
            open={leftOpen}
            onClose={() => setLeftOpen(false)}
            appState={appState}
            planningData={planningData}
            learningData={learningData}
            onBackToWelcome={backToWelcome}
          />
        )}

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-container-lowest">
          {error && (
            <div className="mx-12 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            {renderMainContent()}
          </AnimatePresence>

          {(appState === 'welcome' || appState === 'learning' || appState === 'reflection') &&
            !currentAssessment &&
            !currentJudgment && (
              <BottomInput
                onSend={handleSendMessage}
                appState={appState}
                workflowMode={workflowState?.current_mode}
                onComplete={handleCompleteCurrentNode}
                showCompleteButton={showCompleteButton}
              />
            )}
        </main>

        {appState === 'learning' || appState === 'reflection' ? (
          learningData && (
            <LearningRightSidebar
              data={learningData}
              onComplete={handleCompleteCurrentNode}
              showCompleteButton={showCompleteButton}
            />
          )
        ) : (
          <RightSidebar
            open={rightOpen}
            onClose={() => setRightOpen(false)}
            appState={appState}
            planningData={planningData}
            learningData={learningData}
          />
        )}
      </div>
    </div>
  )
}
