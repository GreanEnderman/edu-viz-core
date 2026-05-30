/**
 * 反思提示卡片
 * 显示顿悟时刻的引导提示
 */

import type { ReflectionPrompt } from '../../types/appFlow'

interface ReflectionCardProps {
  prompt: ReflectionPrompt
  onViewParent: () => void
  onContinue: () => void
}

export function ReflectionCard({ prompt, onViewParent, onContinue }: ReflectionCardProps) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-scale-in">
      <div className="glass-heavy rounded-lg p-8 shadow-xl">
        {/* 图标 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-2xl">lightbulb</span>
          </div>
          <p className="font-sans text-xs text-on-surface-variant uppercase tracking-wider">
            顿悟提示
          </p>
        </div>

        {/* 提示文本 */}
        <p className="font-serif text-lg text-on-surface leading-relaxed mb-6">
          你已经完成<span className="font-bold text-secondary">「{prompt.completedConcept}」</span>。
          现在把它带回到<span className="font-bold text-primary">「{prompt.parentConcept}」</span>。
        </p>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={onViewParent}
            className="flex-1 px-6 py-3 rounded-full border-2 border-secondary text-secondary font-sans text-sm font-medium hover:bg-secondary/5 transition-all"
          >
            看看它如何作用于上层概念
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-sans text-sm font-medium hover:shadow-lg transition-all"
          >
            继续下一个子节点
          </button>
        </div>
      </div>
    </div>
  )
}
