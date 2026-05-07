import { useState } from 'react'
import type { InputMode } from '../../constants/inputModes'
import { inputModes } from '../../constants/inputModes'
import { InputModeSelector } from './InputModeSelector'

interface BottomInputProps {
  onSend: (message: string) => void
}

export function BottomInput({ onSend }: BottomInputProps) {
  const [mode, setMode] = useState<InputMode>('start')
  const [message, setMessage] = useState('')

  const currentMode = inputModes.find((m) => m.id === mode) || inputModes[0]

  const handleSend = () => {
    if (message.trim()) {
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
    <div className="sticky bottom-8 w-full px-12 z-50 mt-auto pb-8">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-white/95 backdrop-blur-xl p-1.5 rounded-full shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/20 flex items-center">
          {/* 左侧：模式选择器 */}
          <InputModeSelector mode={mode} onModeChange={setMode} />

          {/* 中央：输入框 */}
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] text-on-surface placeholder:text-outline-variant/60 px-4 py-4"
            placeholder={currentMode.placeholder}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* 右侧：图标 + 发送按钮 */}
          <div className="flex items-center gap-5 pr-2">
            <div className="flex items-center gap-5 text-outline-variant/80">
              <button className="material-symbols-outlined hover:text-primary transition-colors text-[22px]">
                attachment
              </button>
              <button className="material-symbols-outlined hover:text-primary transition-colors text-[22px]">
                grid_view
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl shadow-sm hover:bg-primary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-2xl">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
