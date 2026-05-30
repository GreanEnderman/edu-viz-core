import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LearningState } from '../../types/appFlow'
import { generateReflectionAnswer } from '../../services/pblService'

interface LearningRightSidebarProps {
  data: LearningState
  onComplete?: () => void
  showCompleteButton?: boolean
}

function splitHelpText(helpText?: string): string[] {
  if (!helpText) return []

  return helpText
    .replace(/\r\n/g, '\n')
    .split(/\n|(?<=[。！？])/u)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function LearningRightSidebar({
  data,
  onComplete,
  showCompleteButton = false,
}: LearningRightSidebarProps) {
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set())
  const [generatedAnswers, setGeneratedAnswers] = useState<Map<string, string>>(new Map())
  const [loadingAnswers, setLoadingAnswers] = useState<Set<string>>(new Set())
  const helpItems = splitHelpText(data.helpText)

  const toggleAnswer = async (questionId: string, question: string) => {
    const isExpanded = expandedAnswers.has(questionId)

    if (isExpanded) {
      setExpandedAnswers((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
      return
    }

    setExpandedAnswers((prev) => new Set(prev).add(questionId))

    if (generatedAnswers.has(questionId)) {
      return
    }

    const isMockData = !data.projectId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )

    if (isMockData) {
      const questionData = data.reflectionQuestions.find((q) => q.id === questionId)
      if (questionData?.answer) {
        setGeneratedAnswers((prev) => new Map(prev).set(questionId, questionData.answer))
      }
      return
    }

    setLoadingAnswers((prev) => new Set(prev).add(questionId))

    try {
      const answer = await generateReflectionAnswer(data.projectId, question)
      setGeneratedAnswers((prev) => new Map(prev).set(questionId, answer))
    } catch (error) {
      console.error('Failed to generate answer:', error)
      const questionData = data.reflectionQuestions.find((q) => q.id === questionId)
      if (questionData?.answer) {
        setGeneratedAnswers((prev) => new Map(prev).set(questionId, questionData.answer))
      } else {
        setGeneratedAnswers((prev) => new Map(prev).set(questionId, '生成答案失败，请重试。'))
      }
    } finally {
      setLoadingAnswers((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  return (
    <aside className="relative z-20 no-scrollbar flex w-[340px] flex-col overflow-y-auto border-l border-outline-variant/10 bg-surface-container-low p-8 pointer-events-auto">
      <section className="mb-10">
        <h4 className="mb-6 font-display text-xs font-bold uppercase tracking-[0.2em] text-outline">
          Project Advancement
        </h4>
        <div className="relative space-y-8">
          <div className="absolute bottom-2 left-[11px] top-2 w-px bg-outline-variant/30" />
          {data.projectAdvancement.map((step) => (
            <div
              key={step.id}
              className={`relative flex gap-4 ${step.status === 'pending' ? 'opacity-40' : ''}`}
            >
              {step.status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-white text-secondary">
                  <span className="material-symbols-outlined text-xs">check</span>
                </div>
              ) : step.status === 'in_progress' ? (
                <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white shadow-[0_0_15px_rgba(119,90,25,0.4)]">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-white text-outline-variant" />
              )}
              <div className="flex-1">
                <p
                  className={`text-xs font-bold ${
                    step.status === 'completed' ? 'text-on-surface/50' : 'text-primary'
                  }`}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-1 text-[10px] italic text-on-surface-variant">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        {showCompleteButton && onComplete && (
          <button
            onClick={onComplete}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-secondary to-secondary/90 px-6 py-3 font-sans text-xs font-semibold text-white shadow-[0px_12px_24px_rgba(119,90,25,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0px_16px_32px_rgba(119,90,25,0.25)]"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span>
              标记为已掌握
            </span>
          </button>
        )}
      </section>

      <div className="mb-10">
        <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-outline">
          它将如何帮助你的项目
        </h4>
        <div className="space-y-4">
          {(helpItems.length > 0 ? helpItems : ['当前节点完成后，会帮助你继续推进项目目标。']).map(
            (item, index) => (
              <div key={`${item}-${index}`} className="space-y-1">
                <div className="mb-2 h-0.5 w-8 bg-secondary/30" />
                <p className="text-xs leading-relaxed text-on-surface-variant">{item}</p>
              </div>
            )
          )}
        </div>
      </div>

      {data.currentArtifact && (
        <section className="mb-8">
          <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-outline">
            Current Artifact
          </h4>
          <div className="overflow-hidden rounded-lg bg-primary p-4 font-mono text-[11px] leading-relaxed text-on-primary-container">
            <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-error/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-secondary-fixed/40" />
                <div className="h-2.5 w-2.5 rounded-full bg-secondary/40" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-white/30">
                {data.currentArtifact.title}
              </span>
            </div>
            <div className="space-y-1 text-white/90">
              {data.currentArtifact.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mb-8">
        <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-outline">
          Reflection 反思
        </h4>
        <div className="space-y-3">
          {data.reflectionQuestions.map((q) => {
            const isExpanded = expandedAnswers.has(q.id)
            const isLoading = loadingAnswers.has(q.id)
            const answer = generatedAnswers.get(q.id) || q.answer

            return (
              <div
                key={q.id}
                className="rounded-lg border border-outline-variant/10 bg-white p-4 shadow-sm"
              >
                <p className="mb-3 text-xs font-bold text-primary">{q.question}</p>
                <button
                  type="button"
                  onClick={() => toggleAnswer(q.id, q.question)}
                  disabled={isLoading}
                  className="relative z-10 w-full rounded-lg border border-secondary/20 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary transition-colors hover:bg-secondary/5 disabled:cursor-not-allowed disabled:opacity-50 pointer-events-auto"
                >
                  {isLoading ? 'Generating...' : isExpanded ? 'Hide Answer' : 'Answer'}
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`${q.id}-answer`}
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -6 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 border-t border-outline-variant/10 pt-3">
                        {isLoading ? (
                          <div className="space-y-2">
                            <motion.div
                              className="h-3 rounded bg-secondary/10"
                              animate={{ opacity: [0.35, 0.7, 0.35] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <motion.div
                              className="h-3 w-5/6 rounded bg-secondary/10"
                              animate={{ opacity: [0.35, 0.7, 0.35] }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 0.1,
                              }}
                            />
                            <motion.div
                              className="h-3 w-2/3 rounded bg-secondary/10"
                              animate={{ opacity: [0.35, 0.7, 0.35] }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: 0.2,
                              }}
                            />
                          </div>
                        ) : answer ? (
                          <motion.p
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="text-[11px] leading-relaxed text-on-surface-variant"
                          >
                            {answer}
                          </motion.p>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h4 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-outline">
          你正在形成的能力
        </h4>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-secondary/30 bg-white px-3 py-1.5 text-[10px] font-bold text-secondary shadow-[0_0_10px_rgba(119,90,25,0.15)]">
            物理建模
          </span>
          <span className="rounded-full border border-outline-variant/20 bg-white px-3 py-1.5 text-[10px] font-bold text-on-surface-variant">
            数学直觉
          </span>
          <span className="rounded-full border border-secondary/30 bg-white px-3 py-1.5 text-[10px] font-bold text-secondary shadow-[0_0_10px_rgba(119,90,25,0.15)]">
            动画实现
          </span>
          <span className="rounded-full border border-outline-variant/20 bg-white px-3 py-1.5 text-[10px] font-bold text-on-surface-variant opacity-60">
            参数可视化
          </span>
        </div>
      </section>
    </aside>
  )
}
