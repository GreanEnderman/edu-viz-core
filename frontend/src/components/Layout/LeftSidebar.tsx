import { useChatStore } from '../../store/chatStore'

interface LeftSidebarProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  onPlugins: () => void
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return '刚刚'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}小时前`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}天前`
  return date.toLocaleDateString('zh-CN')
}

export function LeftSidebar({ open, onClose, onPlugins }: LeftSidebarProps) {
  const conversations = useChatStore((s) => s.conversations)
  const currentId = useChatStore((s) => s.currentId)
  const createConversation = useChatStore((s) => s.createConversation)
  const switchConversation = useChatStore((s) => s.switchConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)

  const handleNew = () => {
    createConversation()
    onClose()
  }

  const handleSwitch = (id: string) => {
    switchConversation(id)
    onClose()
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteConversation(id)
  }

  return (
    <aside
      id="library-sidebar"
      className={`cold-aside fixed left-0 top-0 h-full w-72 flex flex-col py-8 px-6 bg-surface-container-low border-r border-outline-variant/10 z-50 shadow-2xl transition-all duration-500 ease-in-out overflow-hidden${
        open ? '' : ' sidebar-hidden'
      }`}
    >
      {/* Collapse button */}
      <button
        onClick={onClose}
        className="absolute top-10 w-10 h-10 rounded-full border flex items-center justify-center shadow-lg hover:bg-white/90 transition-all duration-300 group bg-white/70 backdrop-blur-md border-outline-variant/40 -right-5 z-[101]"
      >
        <span className="material-symbols-outlined text-secondary text-xl group-hover:scale-110 transition-transform">
          chevron_left
        </span>
      </button>

      <div className="mb-8 min-w-[15rem]">
        <h1 className="font-serif text-xl text-primary font-bold">藏书阁</h1>
        <p className="font-sans font-medium text-xs tracking-[0.3em] uppercase opacity-50 mt-1">思想之源</p>
      </div>

      <button
        onClick={handleNew}
        className="flex items-center justify-center gap-2 w-full py-4 glass-panel rounded-full border border-outline-variant/10 shadow-sm mb-6 min-w-[15rem] hover:bg-white/80 transition-colors"
      >
        <span className="material-symbols-outlined text-secondary">add</span>
        <span className="font-sans font-bold text-sm text-primary">开启新思</span>
      </button>

      <nav className="flex-1 overflow-y-auto no-scrollbar space-y-1 min-w-[15rem]">
        {conversations.length === 0 ? (
          <p className="text-on-surface-variant/40 font-sans text-sm text-center py-8">暂无对话</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSwitch(conv.id)}
              className={`group flex items-center justify-between gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                conv.id === currentId
                  ? 'text-primary font-bold bg-white'
                  : 'text-on-surface-variant/60 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: conv.id === currentId ? "'FILL' 1" : "'FILL' 0" }}>
                  chat_bubble
                </span>
                <div className="min-w-0">
                  <span className="font-sans font-medium text-sm block truncate">{conv.title}</span>
                  <span className="font-sans text-xs opacity-50">{relativeTime(conv.updated_at)}</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5 shrink-0"
                title="删除对话"
              >
                <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">delete</span>
              </button>
            </div>
          ))
        )}
      </nav>

      {/* Plugin manager entry */}
      <button
        onClick={onPlugins}
        className="flex items-center gap-3 px-4 py-3 mt-4 rounded-lg text-on-surface-variant/60 hover:bg-white/50 hover:text-primary transition-colors min-w-[15rem]"
      >
        <span className="material-symbols-outlined text-xl">extension</span>
        <span className="font-sans font-medium text-sm">插件管理</span>
      </button>
    </aside>
  )
}
