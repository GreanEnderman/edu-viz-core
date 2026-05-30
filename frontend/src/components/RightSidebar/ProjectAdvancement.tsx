/**
 * 项目进度组件
 * 显示学习阶段的项目推进步骤
 */

import type { AdvancementStep } from '../../types/appFlow'

interface ProjectAdvancementProps {
  steps: AdvancementStep[]
}

export function ProjectAdvancement({ steps }: ProjectAdvancementProps) {
  const renderStatusIndicator = (status: AdvancementStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-secondary border border-outline-variant">
            <span className="material-symbols-outlined text-xs">check</span>
          </div>
        )
      case 'in_progress':
        return (
          <div className="w-6 h-6 rounded-full bg-secondary shadow-[0_0_15px_rgba(119,90,25,0.4)] flex items-center justify-center text-white z-10">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )
      case 'pending':
        return (
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-outline-variant border border-outline-variant"></div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`flex gap-4 relative animate-fade-in ${
            step.status === 'pending' ? 'opacity-40' : ''
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {renderStatusIndicator(step.status)}
          <div className="flex-1">
            <p className="text-xs font-bold text-primary">{step.label}</p>
            {step.description && (
              <p className="text-[10px] text-on-surface-variant mt-1 italic">
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
