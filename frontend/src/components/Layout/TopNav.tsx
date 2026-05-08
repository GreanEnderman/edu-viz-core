export function TopNav() {
  return (
    <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 bg-background shadow-ambient backdrop-blur-md">
      {/* 左侧：Logo + 导航链接 */}
      <div className="flex items-center gap-12">
        <h1 className="font-display text-2xl font-bold text-primary">AhaTutor v2.0</h1>
        <nav className="hidden md:flex items-center gap-8">
          <a
            className="font-display italic text-2xl font-medium tracking-tight text-stone-500 hover:text-primary transition-colors"
            href="#"
          >
            课程
          </a>
          <a
            className="font-display italic text-2xl font-medium tracking-tight text-stone-500 hover:text-primary transition-colors"
            href="#"
          >
            归档
          </a>
          <a
            className="font-display italic text-2xl font-medium tracking-tight text-stone-500 hover:text-primary transition-colors"
            href="#"
          >
            导师
          </a>
        </nav>
      </div>

      {/* 中央：会话标题（欢迎状态下隐藏） */}
      <div className="flex-1 max-w-md mx-8 relative opacity-0 pointer-events-none">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-secondary truncate">新会话</span>
          <div className="flex-1 h-px bg-outline-variant/20 relative"></div>
        </div>
      </div>

      {/* 右侧：功能按钮 + 头像 */}
      <div className="flex items-center gap-6">
        <button className="material-symbols-outlined text-primary hover:bg-white/50 p-2 rounded-full transition-all">
          history_edu
        </button>
        <button className="material-symbols-outlined text-primary hover:bg-white/50 p-2 rounded-full transition-all">
          notifications
        </button>
        <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20"></div>
        </div>
      </div>
    </header>
  )
}
