import { useState, useRef, useEffect } from 'react'
import { InputMode, inputModes } from '../../constants/inputModes'

interface InputModeSelectorProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
}

export function InputModeSelector({ mode, onModeChange }: InputModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentMode = inputModes.find((m) => m.id === mode) || inputModes[0]

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (modeId: InputMode) => {
    onModeChange(modeId)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* 当前模式按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 pl-5 pr-4 py-3 cursor-pointer hover:bg-black/5 rounded-l-full transition-colors border-r border-outline-variant/10"
      >
        <span className="text-[10px] font-bold text-outline-variant tracking-widest uppercase">
          {currentMode.label}
        </span>
        <span
          className={`material-symbols-outlined text-outline-variant text-[18px] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-outline-variant/10 py-2 z-50 min-w-[120px]">
          {inputModes.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`w-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                m.id === mode
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
