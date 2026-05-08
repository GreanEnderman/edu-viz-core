import type { MouseEvent } from 'react'
import { useChatStore } from '../../store/chatStore'

interface LeftSidebarProps {
  open: boolean
  onClose: () => void
}

export function LeftSidebar({ open, onClose }: LeftSidebarProps) {
  const conversations = useChatStore((state) => state.conversations)
  const currentId = useChatStore((state) => state.currentId)
  const createConversation = useChatStore((state) => state.createConversation)
  const switchConversation = useChatStore((state) => state.switchConversation)
  const deleteConversation = useChatStore((state) => state.deleteConversation)

  const handleNew = async () => {
    await createConversation()
  }

  const handleSwitch = async (id: string) => {
    await switchConversation(id)
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation()
    if (confirm('确定要删除这个对话吗？')) {
      await deleteConversation(id)
    }
  }

  return (
    <aside
      className={`w-[300px] flex-shrink-0 bg-surface-container-low flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar border-r border-outline-variant/10 transition-all duration-300 ${
        open ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'
      }`}
    >
      {/* 标题 */}
      <div className="min-w-[15rem]">
        <h1 className="font-serif text-xl font-bold text-primary">藏书阁</h1>
        <p className="mt-1 text-xs font-medium tracking-[0.3em] uppercase opacity-50 font-sans">
          思想之源
        </p>
      </div>

      {/* 新建对话按钮 */}
      <button
        onClick={handleNew}
        className="flex items-center justify-center gap-2 rounded-full border border-outline-variant/10 py-4 shadow-sm transition-colors bg-white/50 hover:bg-white/80"
      >
        <span className="material-symbols-outlined text-secondary">add</span>
        <span className="text-sm font-bold font-sans text-primary">开启新对话</span>
      </button>

      {/* 对话列表 */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
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
                <span className="material-symbols-outlined shrink-0 text-[20px]">chat_bubble</span>
                <span className="truncate text-sm">{conversation.title || '新对话'}</span>
              </div>
              <button
                onClick={(e) => void handleDelete(e, conversation.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="删除对话"
              >
                <span className="material-symbols-outlined text-[18px] text-error hover:text-error/80">
                  delete
                </span>
              </button>
            </div>
          ))
        )}
      </nav>

      {/* 底部占位 - 项目卡片和知识树（未来实现） */}
      <div className="pt-4 border-t border-outline-variant/10 opacity-40">
        <div className="bg-white/50 p-4 rounded-xl border border-white/20">
          <label className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-2 block">
            上个项目
          </label>
          <p className="text-xs text-on-surface-variant/60">弹簧振子模拟器</p>
        </div>
      </div>
    </aside>
  )
}
