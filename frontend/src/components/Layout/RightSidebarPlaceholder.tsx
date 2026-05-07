export function RightSidebarPlaceholder() {
  return (
    <aside className="w-[340px] flex-shrink-0 bg-surface-container-low/40 opacity-40 grayscale-[0.5] flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar border-l border-outline-variant/10">
      {/* Capabilities 占位 */}
      <div>
        <h4 className="text-xs font-bold text-outline-variant mb-6 tracking-[0.2em] uppercase font-display">
          Capabilities
        </h4>
        <div className="space-y-4">
          <div className="h-2 w-full bg-outline-variant/10 rounded-full"></div>
          <div className="h-2 w-3/4 bg-outline-variant/10 rounded-full"></div>
          <div className="h-2 w-1/2 bg-outline-variant/10 rounded-full"></div>
        </div>
      </div>

      {/* System Status 占位 */}
      <div>
        <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
          System Status
        </h4>
        <div className="p-4 rounded-xl border border-outline-variant/10 bg-white/20">
          <p className="text-[10px] text-outline-variant italic">
            准备就绪，待命开始新的学习旅程。
          </p>
        </div>
      </div>

      {/* Recent Skills 占位 */}
      <div>
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
        </div>
      </div>
    </aside>
  )
}
