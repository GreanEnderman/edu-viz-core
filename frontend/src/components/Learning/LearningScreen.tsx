/**
 * 瀛︿範鐘舵€佷富瀹瑰櫒
 * 灞曠ず绔犺妭鍐呭鍜屽弽鎬濇彁绀?
 */

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppState, LearningState, ReflectionPrompt, PrerequisiteLevel } from '../../types/appFlow'
import type { Assessment, JudgmentResponse, NodeActionResponse } from '../../types/pbl'
import { ChapterContent } from './ChapterContent'
import { PblA2UISurface } from './PblA2UISurface'
import { ReflectionCard } from './ReflectionCard'
import { AssessmentQuestions } from './AssessmentQuestions'
import { MasteryJudgment } from './MasteryJudgment'
import { IntegrationFeedback } from './IntegrationFeedback'

interface LearningScreenProps {
  data: LearningState | null
  a2uiLines?: string[]
  state: AppState
  reflectionPrompt?: ReflectionPrompt | null
  currentAssessment?: Assessment | null
  currentJudgment?: JudgmentResponse | null
  integrationFeedback?: NodeActionResponse['integration_feedback']
  onViewParent?: () => void
  onContinue?: () => void
  onPrerequisiteSelect?: (level: PrerequisiteLevel) => void
  onAssessmentSubmit?: (answers: string[]) => void
  onJudgmentContinue?: () => void
  onIntegrationContinue?: () => void
}

export function LearningScreen({
  data,
  a2uiLines = [],
  state,
  reflectionPrompt,
  currentAssessment,
  currentJudgment,
  integrationFeedback,
  onViewParent,
  onContinue,
  onPrerequisiteSelect,
  onAssessmentSubmit,
  onJudgmentContinue,
  onIntegrationContinue,
}: LearningScreenProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const screenKey = currentAssessment
    ? `assessment-${currentAssessment.id}`
    : currentJudgment
    ? `judgment-${currentJudgment.attempt.id}`
    : `chapter-${data?.currentChapter.id ?? 'empty'}-${state}`

  // 自动滚动到底部，跟随流式输出
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [a2uiLines, reflectionPrompt, currentAssessment, currentJudgment, integrationFeedback])

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-on-surface-variant">鍔犺浇涓?..</p>
      </div>
    )
  }

  return (
    <div
      className="flex-1 min-h-0 flex flex-col bg-surface-container-lowest relative overflow-y-auto no-scrollbar"
      ref={scrollContainerRef}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screenKey}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex-1 min-h-0"
        >
          {currentAssessment && onAssessmentSubmit ? (
            <AssessmentQuestions assessment={currentAssessment} onSubmit={onAssessmentSubmit} />
          ) : currentJudgment && onJudgmentContinue ? (
            <MasteryJudgment judgment={currentJudgment} onContinue={onJudgmentContinue} />
          ) : (
            <>
              <ChapterContent
                chapter={data.currentChapter}
                onPrerequisiteSelect={onPrerequisiteSelect}
              />
              <PblA2UISurface lines={a2uiLines} resetKey={data.currentChapter.id} />

              {state === 'reflection' && reflectionPrompt && onViewParent && onContinue && (
                <ReflectionCard
                  prompt={reflectionPrompt}
                  onViewParent={onViewParent}
                  onContinue={onContinue}
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div
        aria-hidden="true"
        className="shrink-0"
        style={{ height: 'calc(22rem + 2px + 2rem)' }}
      />

      {integrationFeedback && onIntegrationContinue && (
        <IntegrationFeedback
          summary={integrationFeedback.summary}
          projectApplication={integrationFeedback.project_application}
          nextSteps={integrationFeedback.next_steps}
          progress={integrationFeedback.progress}
          onContinue={onIntegrationContinue}
        />
      )}
    </div>
  )
}
