/**
 * 掌握度判定结果组件
 * 显示 MasteryJudgeAgent 的判定结果
 */

import { motion } from 'framer-motion'
import type { AssessmentAttempt, JudgmentResponse } from '../../types/pbl'

interface MasteryJudgmentProps {
  judgment: JudgmentResponse
  onContinue: () => void
}

export function MasteryJudgment({ judgment, onContinue }: MasteryJudgmentProps) {
  const attempt = judgment.attempt
  const statusConfig: Record<
    AssessmentAttempt['status'],
    { label: string; icon: string; color: string; bgColor: string; borderColor: string }
  > = {
    mastered: {
      label: '已掌握',
      icon: 'verified',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    review: {
      label: '需要复习',
      icon: 'update',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    learning: {
      label: '需要学习',
      icon: 'school',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  }

  const config = statusConfig[attempt.status]
  const scorePercentage = Math.round(attempt.score * 100)

  return (
    <motion.div
      className="flex-1 flex flex-col px-16 py-12 overflow-y-auto no-scrollbar"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* 标题 */}
      <div className="mb-6 animate-fade-in">
        <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-sans font-medium uppercase tracking-wider">
          测评结果
        </span>
      </div>

      <h2 className="font-display text-[42px] text-primary leading-tight font-bold mb-8 animate-fade-in animate-delay-100">
        你的掌握程度
      </h2>

      {/* 判定状态卡片 */}
      <motion.div
        className={`p-8 rounded-lg border-2 ${config.borderColor} ${config.bgColor} mb-8 animate-fade-in animate-delay-200`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.08 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <span className={`material-symbols-outlined text-4xl ${config.color}`}>
            {config.icon}
          </span>
          <div>
            <h3 className={`font-display text-2xl font-bold ${config.color}`}>
              {config.label}
            </h3>
            <p className="font-sans text-sm text-on-surface-variant mt-1">
              得分：{scorePercentage}%
            </p>
          </div>
        </div>

        {/* 判定理由 */}
        <div className="mt-4 p-4 rounded-lg bg-white/50">
          <p className="font-serif text-sm text-on-surface leading-relaxed">
            {attempt.reasoning}
          </p>
        </div>
      </motion.div>

      {/* 薄弱点 */}
      {attempt.weak_points.length > 0 && (
        <div className="mb-8 animate-fade-in animate-delay-300">
          <h3 className="font-display text-xl text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-600">warning</span>
            需要加强的地方
          </h3>
          <ul className="space-y-2">
            {attempt.weak_points.map((point: string, index: number) => (
              <li
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center font-sans text-xs font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="font-sans text-sm text-on-surface">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 建议 */}
      {attempt.suggestions.length > 0 && (
        <div className="mb-8 animate-fade-in animate-delay-400">
          <h3 className="font-display text-xl text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">lightbulb</span>
            学习建议
          </h3>
          <ul className="space-y-2">
            {attempt.suggestions.map((suggestion: string, index: number) => (
              <li
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200"
              >
                <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0">
                  arrow_forward
                </span>
                <span className="font-sans text-sm text-on-surface">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 继续按钮 */}
      <div className="flex justify-end mt-8 animate-fade-in animate-delay-500">
        <button
          onClick={onContinue}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-primary to-primary/90 text-white font-sans text-sm font-bold hover:shadow-lg hover:scale-105 transition-all"
        >
          {attempt.status === 'mastered' ? '继续下一个节点' : '开始学习'}
        </button>
      </div>
    </motion.div>
  )
}
