/**
 * 系统进程列表组件
 * 显示规划阶段的系统处理进度
 */

import type { SystemProcess } from '../../types/appFlow'

interface SystemProcessListProps {
  processes: SystemProcess[]
}

export function SystemProcessList({ processes }: SystemProcessListProps) {
  const renderStatusIndicator = (status: SystemProcess['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-5 h-5 rounded bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px] text-secondary">check</span>
          </div>
        )
      case 'in_progress':
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          </div>
        )
      case 'pending':
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full border border-outline-variant"></div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {processes.map((process, index) => (
        <div
          key={process.id}
          className={`flex gap-4 items-start animate-fade-in`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {renderStatusIndicator(process.status)}
          <div>
            <p
              className={`text-xs font-bold ${
                process.status === 'pending' ? 'text-on-surface-variant' : 'text-primary'
              }`}
            >
              {process.label}
            </p>
            {process.description && (
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                {process.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
