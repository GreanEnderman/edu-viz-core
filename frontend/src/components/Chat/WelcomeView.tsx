import { ChatInput } from './ChatInput'

interface WelcomeViewProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function WelcomeView({ onSend, disabled }: WelcomeViewProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <h1 className="font-display text-4xl font-light text-primary mb-3 text-center leading-tight">
          洞察的建构
        </h1>
        <p className="font-sans text-sm text-on-surface-variant text-center mb-10 leading-relaxed">
          提出你的问题，开始一段思维的旅程
        </p>
        <ChatInput onSend={onSend} disabled={disabled} autoFocus />
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {[
            '简谐运动的能量守恒',
            '牛顿第二定律的推导',
            '向量叉积的几何意义',
          ].map((hint) => (
            <button
              key={hint}
              onClick={() => onSend(hint)}
              className="px-3 py-1.5 rounded-full text-xs font-sans text-secondary border border-outline-variant/15 hover:bg-secondary-container/30 transition-colors"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
