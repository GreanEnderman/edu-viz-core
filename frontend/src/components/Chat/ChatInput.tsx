import { useState, useRef, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function ChatInput({ onSend, disabled, placeholder = '向虚空提出一个问题...', autoFocus }: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-3xl mx-auto relative group">
      <div className="absolute -inset-4 bg-secondary/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center gap-6 relative z-10 border-b border-outline-variant/30 focus-within:border-secondary/40 transition-colors py-4 px-2">
        <span className="material-symbols-outlined text-on-surface-variant/40">attachment</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/30 font-sans text-xl italic text-on-surface"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="text-on-surface-variant/40 hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="发送"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      </div>
    </div>
  )
}
