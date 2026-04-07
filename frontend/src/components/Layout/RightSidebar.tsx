interface RightSidebarProps {
  open: boolean
  onClose: () => void
}

export function RightSidebar({ open, onClose }: RightSidebarProps) {
  return (
    <aside
      id="synthesis-sidebar"
      className={`fixed right-0 top-0 h-full w-96 bg-surface-container-low border-l border-outline-variant/10 p-8 flex flex-col gap-8 z-50 transition-all duration-500 ease-in-out shadow-2xl${
        open ? '' : ' sidebar-right-hidden'
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-primary font-bold">综合思考</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      <div className="h-64 rounded-xl bg-white border border-outline-variant/10 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full p-4" viewBox="0 0 200 100">
            <circle cx="100" cy="50" fill="#182544" r="6" />
            <line stroke="#775a19" strokeWidth="0.5" x1="100" x2="60" y1="50" y2="30" />
            <line stroke="#775a19" strokeWidth="0.5" x1="100" x2="140" y1="50" y2="30" />
            <line stroke="#775a19" strokeWidth="0.5" x1="100" x2="100" y1="50" y2="80" />
            <circle cx="60" cy="30" fill="#e9c176" r="3" />
            <circle cx="140" cy="30" fill="#e9c176" r="3" />
            <circle cx="100" cy="80" fill="#e9c176" r="3" />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm">lightbulb</span>
          <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">启发时刻</h4>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border-l-2 border-secondary shadow-sm">
            <p className="font-sans text-sm text-primary font-medium leading-relaxed italic">在对话中发现的洞察将显示在此处。</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">基石</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary text-surface p-4 rounded-xl flex flex-col justify-between aspect-square">
            <span className="material-symbols-outlined text-sm">book</span>
            <p className="font-serif text-xs leading-tight font-medium">相关知识文档</p>
          </div>
          <div className="bg-surface-container-highest p-4 rounded-xl flex flex-col justify-between aspect-square">
            <span className="material-symbols-outlined text-primary text-sm">article</span>
            <p className="font-sans font-bold text-[8px] text-primary">学习笔记</p>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-outline-variant/10">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-2">
          <span>正在生成综合报告...</span>
          <span>84%</span>
        </div>
        <div className="h-[1px] w-full bg-outline-variant/20 relative">
          <div className="absolute left-0 top-0 h-full bg-secondary w-[84%]"></div>
        </div>
      </div>
    </aside>
  )
}
