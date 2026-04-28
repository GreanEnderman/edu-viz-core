import type { MouseEvent } from 'react'
import { useChatStore } from '../../store/chatStore'
import { formatRelativeTime } from '../../utils/date'

interface LeftSidebarProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  onPlugins: () => void
}

export function LeftSidebar({ open, onOpen, onClose, onPlugins }: LeftSidebarProps) {
  const conversations = useChatStore((state) => state.conversations)
  const currentId = useChatStore((state) => state.currentId)
  const createConversation = useChatStore((state) => state.createConversation)
  const switchConversation = useChatStore((state) => state.switchConversation)
  const deleteConversation = useChatStore((state) => state.deleteConversation)

  const handleNew = async () => {
    await createConversation()
    onClose()
  }

  const handleSwitch = async (id: string) => {
    await switchConversation(id)
    onClose()
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation()
    await deleteConversation(id)
  }

  return (
    <aside
      id="library-sidebar"
      className={`cold-aside fixed left-0 top-0 z-50 flex h-full w-72 flex-col overflow-hidden border-r border-outline-variant/10 bg-surface-container-low px-6 py-8 shadow-2xl transition-all duration-500 ease-in-out${
        open ? '' : ' sidebar-hidden'
      }`}
    >
      <button
        onClick={open ? onClose : onOpen}
        className="absolute top-10 -right-5 z-[101] flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 bg-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/90 group"
        aria-label={open ? '关闭藏书阁' : '打开藏书阁'}
      >
        <span className="text-xl transition-transform material-symbols-outlined text-secondary group-hover:scale-110">
          {open ? 'chevron_left' : 'chevron_right'}
        </span>
      </button>

      <div className="min-w-[15rem] mb-8">
        <h1 className="font-serif text-xl font-bold text-primary">藏书阁</h1>
        <p className="mt-1 text-xs font-medium tracking-[0.3em] uppercase opacity-50 font-sans">思想之源</p>
      </div>

      <button
        onClick={handleNew}
        className="glass-panel mb-6 flex min-w-[15rem] items-center justify-center gap-2 rounded-full border border-outline-variant/10 py-4 shadow-sm transition-colors hover:bg-white/80"
      >
        <span className="material-symbols-outlined text-secondary">add</span>
        <span className="text-sm font-bold font-sans text-primary">开启新对话</span>
      </button>

      <nav className="min-w-[15rem] flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {conversations.length === 0 ? (
          <p className="py-8 text-sm text-center text-on-surface-variant/40 font-sans">暂无对话</p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => void handleSwitch(conversation.id)}
              className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-4 py-3 transition-colors ${
                conversation.id === currentId
                  ? 'bg-white font-bold text-primary'
                  : 'text-on-surface-variant/60 hover:bg-white/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{
                    fontVariationSettings:
                      conversation.id === currentId ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  chat_bubble
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium font-sans">{conversation.title}</span>
                  <span className="text-xs opacity-50 font-sans">{formatRelativeTime(conversation.updated_at)}</span>
                </div>
              </div>
              <button
                onClick={(event) => void handleDelete(event, conversation.id)}
                className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5"
                title="删除对话"
              >
                <span className="text-lg material-symbols-outlined text-on-surface-variant/40">delete</span>
              </button>
            </div>
          ))
        )}
      </nav>

      <button
        onClick={onPlugins}
        className="mt-4 flex min-w-[15rem] items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant/60 transition-colors hover:bg-white/50 hover:text-primary"
      >
        <span className="text-xl material-symbols-outlined">extension</span>
        <span className="text-sm font-medium font-sans">插件管理</span>
      </button>
    </aside>
  )
}
