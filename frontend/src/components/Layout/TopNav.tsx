import { useChatStore } from '../../store/chatStore'

interface TopNavProps {
  onToggleLeft: () => void
  onToggleRight: () => void
}

export function TopNav({ onToggleLeft, onToggleRight }: TopNavProps) {
  const currentId = useChatStore((s) => s.currentId)
  const conversations = useChatStore((s) => s.conversations)
  const title = conversations.find((c) => c.id === currentId)?.title

  return (
    <header className="cold-header w-full flex justify-between items-center px-6 h-24 z-10 shrink-0">
      <button
        onClick={onToggleLeft}
        className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
        aria-label="开启藏书阁"
      >
        <span className="material-symbols-outlined">menu</span>
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
          开启藏书阁
        </span>
      </button>

      <div className="text-center select-none">
        <h2 className="font-serif text-2xl tracking-tight text-primary opacity-80">{title ?? '洞察的建构'}</h2>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={onToggleRight}
          className="flex items-center gap-2 text-secondary group"
          aria-label="综合思考"
        >
          <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
            综合思考
          </span>
          <span className="material-symbols-outlined">auto_awesome</span>
        </button>
      </div>
    </header>
  )
}
