/**
 * 节点完成集成反馈组件
 * 显示 IntegrationService 生成的反馈
 */

import { motion } from 'framer-motion'

interface IntegrationFeedbackProps {
  summary: string
  projectApplication: string
  nextSteps: string[]
  progress: number
  onContinue: () => void
}

export function IntegrationFeedback({
  summary,
  projectApplication,
  nextSteps,
  progress,
  onContinue,
}: IntegrationFeedbackProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <motion.div
        className="bg-surface rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-8 animate-scale-in"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* 庆祝图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center animate-bounce-in">
            <span className="material-symbols-outlined text-5xl text-white">
              celebration
            </span>
          </div>
        </div>

        {/* 总结 */}
        <h2 className="font-display text-3xl text-primary font-bold text-center mb-4">
          {summary}
        </h2>

        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-sm text-on-surface-variant">学习进度</span>
            <span className="font-sans text-sm font-bold text-secondary">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-secondary/70 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 项目应用 */}
        <div className="mb-6 p-6 rounded-lg bg-surface-container-low">
          <h3 className="font-display text-lg text-primary font-semibold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">
              integration_instructions
            </span>
            如何应用到项目中
          </h3>
          <p className="font-serif text-sm text-on-surface leading-relaxed">
            {projectApplication}
          </p>
        </div>

        {/* 下一步建议 */}
        {nextSteps.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-lg text-primary font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">
                arrow_forward
              </span>
              下一步
            </h3>
            <ul className="space-y-2">
              {nextSteps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-sans text-xs font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="font-sans text-sm text-on-surface">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 继续按钮 */}
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white font-sans text-sm font-bold hover:shadow-lg hover:scale-105 transition-all"
          >
            继续学习
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
