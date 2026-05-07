export function LeftSidebarPlaceholder() {
  return (
    <aside className="w-[300px] flex-shrink-0 bg-surface-container-low/40 opacity-40 grayscale-[0.5] flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar border-r border-outline-variant/10">
      {/* 项目卡片占位 */}
      <div className="bg-white/50 p-6 rounded-[24px] border border-white/20">
        <label className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-2 block">
          上个项目
        </label>
        <h3 className="font-display text-xl font-bold text-primary/60 mb-2">弹簧振子模拟器</h3>
        <p className="text-xs text-on-surface-variant/60 leading-relaxed mb-4">
          完成一个可调节参数的交互模拟网页。
        </p>
      </div>

      {/* 知识树导航占位 */}
      <div className="flex-1 flex flex-col pt-4">
        <div className="space-y-2">
          <div className="bg-white/30 p-3 rounded-xl border border-white/20">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-outline-variant/40"></span>
              <span className="text-xs font-bold text-outline-variant">物理基础</span>
            </div>
          </div>
          <div className="ml-5 pl-4 border-l border-outline-variant/10 space-y-2">
            <div className="text-xs text-on-surface-variant/40">位移速度关系</div>
            <div className="text-xs text-on-surface-variant/40">能量守恒</div>
          </div>
        </div>
      </div>

      {/* 历史会话占位 */}
      <div className="pt-4 border-t border-outline-variant/10 space-y-2">
        <div className="bg-white/20 p-3 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-sm text-outline-variant">history</span>
          <span className="text-xs font-medium text-on-surface-variant/40">历史学习会话</span>
        </div>
      </div>
    </aside>
  )
}
