export function LeftSidebarPlaceholder() {
  return (
    <aside className="w-[300px] flex-shrink-0 bg-surface-container-low/40 opacity-40 grayscale-[0.5] flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar border-r border-outline-variant/10">
      {/* 标题区域占位 */}
      <div className="space-y-2">
        <div className="h-6 w-32 bg-outline-variant/20 rounded"></div>
        <div className="h-3 w-24 bg-outline-variant/15 rounded"></div>
      </div>

      {/* 项目卡片占位 */}
      <div className="bg-white/50 p-6 rounded-[16px] border border-white/20 space-y-3">
        <div className="h-3 w-16 bg-outline-variant/20 rounded"></div>
        <div className="h-5 w-full bg-outline-variant/25 rounded"></div>
        <div className="h-4 w-4/5 bg-outline-variant/15 rounded"></div>
        <div className="h-4 w-3/4 bg-outline-variant/15 rounded"></div>
      </div>

      {/* 知识树导航占位 */}
      <div className="flex-1 flex flex-col space-y-3">
        <div className="bg-white/30 p-4 rounded-lg border border-white/20">
          <div className="h-4 w-20 bg-outline-variant/20 rounded"></div>
        </div>
        <div className="ml-5 space-y-2">
          <div className="h-3 w-28 bg-outline-variant/15 rounded"></div>
          <div className="h-3 w-24 bg-outline-variant/15 rounded"></div>
        </div>
      </div>

      {/* 按钮占位 */}
      <div className="h-12 bg-white/50 rounded-full border border-outline-variant/10"></div>

      {/* 历史会话占位 */}
      <div className="space-y-2">
        <div className="h-3 w-20 bg-outline-variant/20 rounded"></div>
        <div className="bg-white/30 p-3 rounded-lg border border-white/20">
          <div className="h-4 w-full bg-outline-variant/15 rounded"></div>
        </div>
        <div className="bg-white/30 p-3 rounded-lg border border-white/20">
          <div className="h-4 w-3/4 bg-outline-variant/15 rounded"></div>
        </div>
      </div>

      {/* 插件管理按钮占位 */}
      <div className="h-10 bg-white/30 rounded-full border border-outline-variant/10"></div>
    </aside>
  )
}
