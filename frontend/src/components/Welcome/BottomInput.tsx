import { useEffect, useState } from 'react'
import type { InputMode } from '../../constants/inputModes'
import { inputModes } from '../../constants/inputModes'
import { InputModeSelector } from './InputModeSelector'
import { AppStateIndicator } from './AppStateIndicator'
import type { AppState } from '../../types/appFlow'
import type { PblWorkflowMode } from '../../types/pbl'

interface BottomInputProps {
  onSend: (message: string) => void
  appState?: AppState
  workflowMode?: PblWorkflowMode
  onComplete?: () => void
  showCompleteButton?: boolean
}

export function BottomInput({
  onSend,
  appState = 'welcome',
  workflowMode,
  onComplete,
  showCompleteButton = false,
}: BottomInputProps) {
  const [mode, setMode] = useState<InputMode>('start')
  const [message, setMessage] = useState('')

  useEffect(() => {
    switch (appState) {
      case 'welcome':
        setMode('start')
        break
      case 'planning':
        setMode('plan')
        break
      case 'learning':
      case 'reflection':
        setMode('ask')
        break
    }
  }, [appState])

  const currentMode = inputModes.find((m) => m.id === mode) || inputModes[0]

  const handleSend = () => {
    if (message.trim()) {
      const completeKeywords = /^(完成|学会了|理解了|下一个|继续|掌握了|明白了)$/i
      if (completeKeywords.test(message.trim()) && onComplete) {
        onComplete()
        setMessage('')
        return
      }

      onSend(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 w-full px-12 pb-8">
      <div className="mx-auto max-w-[800px]">
        <div className="pointer-events-auto mb-3 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <AppStateIndicator currentMode={workflowMode} />
            <InputModeSelector mode={mode} onModeChange={setMode} compact />
          </div>
          {showCompleteButton && onComplete && (
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-4 py-2 text-xs font-sans font-semibold text-secondary shadow-[0px_10px_24px_rgba(27,28,26,0.08)] ring-1 ring-secondary/15 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0px_14px_30px_rgba(27,28,26,0.12)]"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>我学会了</span>
            </button>
          )}
        </div>

        <div className="pointer-events-auto flex items-center rounded-full border border-outline-variant/20 bg-white/95 p-1.5 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <input
            className="flex-1 border-none bg-transparent px-4 py-4 text-[15px] text-on-surface placeholder:text-outline-variant/60 focus:outline-none focus:ring-0"
            placeholder={currentMode.placeholder}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center gap-5 pr-2">
            <div className="flex items-center gap-5 text-outline-variant/80">
              <button className="material-symbols-outlined text-[22px] transition-colors hover:text-primary">
                attachment
              </button>
              <button className="material-symbols-outlined text-[22px] transition-colors hover:text-primary">
                grid_view
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-2xl">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
