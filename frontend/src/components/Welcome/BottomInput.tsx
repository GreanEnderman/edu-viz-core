interface BottomInputProps {
  onSend: (message: string) => void
}

export function BottomInput({ onSend }: BottomInputProps) {
  return (
    <div className="sticky bottom-8 w-full px-12 z-50 mt-auto pb-8">
      <div className="max-w-[800px] mx-auto">
        <div className="bg-white/95 backdrop-blur-xl p-1.5 rounded-full shadow-[0px_4px_24px_rgba(0,0,0,0.06)] border border-outline-variant/20 flex items-center">
          {/* 左侧：START 下拉 */}
          <div className="flex items-center gap-1.5 pl-5 pr-4 py-3 cursor-pointer hover:bg-black/5 rounded-l-full transition-colors border-r border-outline-variant/10">
            <span className="text-[10px] font-bold text-outline-variant tracking-widest uppercase">
              Start
            </span>
            <span className="material-symbols-outlined text-outline-variant text-[18px]">
              expand_more
            </span>
          </div>

          {/* 中央：输入框 */}
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-on-surface placeholder:text-outline-variant/60 px-4 py-4"
            placeholder="描述一个你想尝试的项目，或者问问我的建议..."
            type="text"
          />

          {/* 右侧：图标 + 发送按钮 */}
          <div className="flex items-center gap-5 pr-2">
            <div className="flex items-center gap-5 text-outline-variant/80">
              <button className="material-symbols-outlined hover:text-primary transition-colors text-[22px]">
                attachment
              </button>
              <button className="material-symbols-outlined hover:text-primary transition-colors text-[22px]">
                grid_view
              </button>
            </div>
            <button className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl shadow-sm hover:bg-primary-container transition-all">
              <span className="material-symbols-outlined text-2xl">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
