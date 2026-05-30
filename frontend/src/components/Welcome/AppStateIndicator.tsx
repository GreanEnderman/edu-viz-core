import type { PblWorkflowMode } from '../../types/pbl'

interface AppStateIndicatorProps {
  currentMode?: PblWorkflowMode
}

const modeLabels: Record<PblWorkflowMode, string> = {
  planning: '规划',
  assessment: '测评',
  learning: '学习',
  review: '复习',
  building: '构建',
}

const modeIcons: Record<PblWorkflowMode, string> = {
  planning: 'edit_note',
  assessment: 'quiz',
  learning: 'school',
  review: 'history_edu',
  building: 'construction',
}

export function AppStateIndicator({ currentMode }: AppStateIndicatorProps) {
  if (!currentMode) return null

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-4 py-2 text-xs font-sans shadow-[0px_10px_24px_rgba(27,28,26,0.08)] ring-1 ring-outline-variant/10 backdrop-blur-xl">
      <span className="material-symbols-outlined text-sm text-outline">
        {modeIcons[currentMode]}
      </span>
      <span className="font-medium text-outline">当前模式：</span>
      <span className="font-semibold text-primary">{modeLabels[currentMode]}</span>
    </div>
  )
}
