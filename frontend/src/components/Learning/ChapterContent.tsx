import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { Chapter, PrerequisiteLevel } from '../../types/appFlow'

interface ChapterContentProps {
  chapter: Chapter
  onPrerequisiteSelect?: (level: PrerequisiteLevel) => void
}

export function ChapterContent({ chapter, onPrerequisiteSelect }: ChapterContentProps) {
  const [selectedLevel, setSelectedLevel] = useState<PrerequisiteLevel | null>(null)

  useEffect(() => {
    setSelectedLevel(null)
  }, [chapter.id])

  const handleLevelSelect = (level: PrerequisiteLevel) => {
    setSelectedLevel(level)
    onPrerequisiteSelect?.(level)
  }

  return (
    <div className="flex flex-col px-16 py-12">
      <div className="mb-6 animate-fade-in">
        <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-secondary">
          当前学习节点
        </span>
      </div>

      <h2 className="mb-8 font-display text-[42px] font-bold leading-tight text-primary animate-fade-in animate-delay-100">
        {chapter.title}
      </h2>

      <AnimatePresence initial={false}>
        {chapter.showPrerequisiteCheck !== false && chapter.prerequisiteCheck && !selectedLevel && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -12 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="mb-12 overflow-hidden"
          >
            <div className="rounded-lg bg-surface-container-low p-8 animate-fade-in animate-delay-200">
              <p className="mb-6 font-sans text-sm text-on-surface-variant">
                {chapter.prerequisiteCheck.question}
              </p>
              <div className="grid grid-cols-4 gap-4">
                {chapter.prerequisiteCheck.options.map((option) => {
                  const iconMap = {
                    master: 'verified',
                    familiar: 'update',
                    uncertain: 'quiz',
                    unfamiliar: 'help_outline',
                  }

                  return (
                    <button
                      key={option.level}
                      onClick={() => handleLevelSelect(option.level)}
                      className="group flex h-[72px] flex-col items-center justify-center rounded-[14px] border border-outline-variant/20 bg-white p-4 transition-all hover:border-secondary hover:shadow-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-secondary transition-transform group-hover:scale-110">
                          {iconMap[option.level]}
                        </span>
                        <span className="text-sm font-bold text-primary">{option.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="mt-4 font-sans text-xs italic text-on-surface-variant">
                在继续之前，我们先确认你对这部分内容的熟悉程度。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="prose prose-lg max-w-none animate-fade-in animate-delay-300">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h2: ({ children }) => (
              <h2 className="mt-8 mb-4 font-display text-2xl font-bold text-primary">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-6 mb-3 font-display text-xl font-semibold text-primary">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 font-serif text-base leading-relaxed text-on-surface">
                {children}
              </p>
            ),
            hr: () => <hr className="my-8 border-outline-variant/20" />,
          }}
        >
          {chapter.content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
