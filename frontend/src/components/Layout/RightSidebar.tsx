interface RightSidebarProps {
  open: boolean
  onClose: () => void
}

export function RightSidebar({ open, onClose }: RightSidebarProps) {
  return (
    <aside
      className={`w-[340px] flex-shrink-0 bg-surface-container-low flex flex-col p-8 space-y-10 overflow-y-auto no-scrollbar border-l border-outline-variant/10 transition-all duration-300 ${
        open ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'
      }`}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-primary font-bold">综合思考</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      {/* 能力进度 */}
      <section>
        <h4 className="text-xs font-bold text-outline-variant mb-6 tracking-[0.2em] uppercase font-display">
          Capabilities
        </h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>物理建模</span>
              <span>75%</span>
            </div>
            <div className="h-2 w-full bg-outline-variant/10 rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-3/4 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>动画实现</span>
              <span>60%</span>
            </div>
            <div className="h-2 w-full bg-outline-variant/10 rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-3/5 rounded-full"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-on-surface-variant">
              <span>数学推导</span>
              <span>45%</span>
            </div>
            <div className="h-2 w-full bg-outline-variant/10 rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-[45%] rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 系统状态 */}
      <section>
        <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
          System Status
        </h4>
        <div className="p-4 rounded-xl border border-outline-variant/10 bg-white/20">
          <p className="text-[10px] text-outline-variant italic leading-relaxed">
            准备就绪，待命开始新的学习旅程。
          </p>
        </div>
      </section>

      {/* 技能标签 */}
      <section>
        <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
          Recent Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
            物理建模
          </span>
          <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
            动画实现
          </span>
          <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
            Canvas API
          </span>
          <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
            简谐运动
          </span>
        </div>
      </section>

      {/* 启发时刻 */}
      <section className="flex-1">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-secondary text-sm">lightbulb</span>
          <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
            启发时刻
          </h4>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-white rounded-lg border-l-2 border-secondary shadow-sm">
            <p className="font-sans text-sm text-primary font-medium leading-relaxed italic">
              在对话中发现的洞察将显示在此处。
            </p>
          </div>
        </div>
      </section>

      {/* 基石 */}
      <section>
        <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
          基石
        </h4>
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
      </section>
    </aside>
  )
}
