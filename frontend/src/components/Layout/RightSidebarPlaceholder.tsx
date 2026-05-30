export function RightSidebarPlaceholder() {
  return (
    <aside className="w-[340px] flex-shrink-0 bg-surface-container-low/40 opacity-40 grayscale-[0.5] flex flex-col p-8 space-y-10 overflow-y-auto no-scrollbar border-l border-outline-variant/10">
      {/* 标题区域占位 */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-outline-variant/20 rounded"></div>
        <div className="w-8 h-8 bg-outline-variant/15 rounded-full"></div>
      </div>

      {/* Capabilities 占位 */}
      <div className="space-y-4">
        <div className="h-3 w-28 bg-outline-variant/20 rounded"></div>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="h-2 w-full bg-outline-variant/15 rounded-full"></div>
            <div className="h-2 w-full bg-outline-variant/10 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-outline-variant/15 rounded-full"></div>
            <div className="h-2 w-3/4 bg-outline-variant/10 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-outline-variant/15 rounded-full"></div>
            <div className="h-2 w-1/2 bg-outline-variant/10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* System Status 占位 */}
      <div className="space-y-4">
        <div className="h-3 w-32 bg-outline-variant/20 rounded"></div>
        <div className="p-4 rounded-lg border border-outline-variant/10 bg-white/20">
          <div className="space-y-2">
            <div className="h-2 w-full bg-outline-variant/15 rounded"></div>
            <div className="h-2 w-4/5 bg-outline-variant/15 rounded"></div>
          </div>
        </div>
      </div>

      {/* Recent Skills 占位 */}
      <div className="space-y-4">
        <div className="h-3 w-28 bg-outline-variant/20 rounded"></div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-20 bg-white/30 rounded-full border border-outline-variant/20"></div>
          <div className="h-6 w-24 bg-white/30 rounded-full border border-outline-variant/20"></div>
          <div className="h-6 w-20 bg-white/30 rounded-full border border-outline-variant/20"></div>
          <div className="h-6 w-16 bg-white/30 rounded-full border border-outline-variant/20"></div>
        </div>
      </div>

      {/* 启发时刻占位 */}
      <div className="flex-1 space-y-4">
        <div className="h-3 w-24 bg-outline-variant/20 rounded"></div>
        <div className="p-4 bg-white rounded-lg border-l-2 border-outline-variant/20 shadow-sm space-y-2">
          <div className="h-3 w-full bg-outline-variant/15 rounded"></div>
          <div className="h-3 w-4/5 bg-outline-variant/15 rounded"></div>
        </div>
      </div>

      {/* 基石占位 */}
      <div className="space-y-4">
        <div className="h-3 w-16 bg-outline-variant/20 rounded"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-outline-variant/20 p-4 rounded-lg aspect-square"></div>
          <div className="bg-outline-variant/15 p-4 rounded-lg aspect-square"></div>
        </div>
      </div>
    </aside>
  )
}
