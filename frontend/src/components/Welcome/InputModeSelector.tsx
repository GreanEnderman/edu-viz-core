import { useEffect, useRef, useState } from 'react'
import type { InputMode } from '../../constants/inputModes'
import { inputModes } from '../../constants/inputModes'

interface InputModeSelectorProps {
  mode: InputMode
  onModeChange: (mode: InputMode) => void
  compact?: boolean
}

export function InputModeSelector({
  mode,
  onModeChange,
  compact = false,
}: InputModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentMode = inputModes.find((m) => m.id === mode) || inputModes[0]

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 rounded-full bg-white/92 px-4 py-2 text-xs shadow-[0px_10px_24px_rgba(27,28,26,0.08)] ring-1 ring-outline-variant/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white'
            : 'flex cursor-pointer items-center gap-1.5 rounded-l-full border-r border-outline-variant/10 pl-5 pr-4 py-3 transition-colors hover:bg-black/5'
        }
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${
            compact ? 'text-outline' : 'text-outline-variant'
          }`}
        >
          {currentMode.label}
        </span>
        <span
          className={`material-symbols-outlined text-[18px] transition-transform ${
            compact ? 'text-outline' : 'text-outline-variant'
          } ${isOpen ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 min-w-[120px] rounded-lg border border-outline-variant/10 bg-white py-2 shadow-lg">
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
