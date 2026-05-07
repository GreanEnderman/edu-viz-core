import type { ComponentCategory } from './showcaseData'

interface SidebarProps {
  categories: ComponentCategory[]
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
}

/**
 * 组件预览库侧边栏
 * 显示分类导航
 */
export function Sidebar({ categories, selectedCategory, onSelectCategory }: SidebarProps) {
  // 计算每个分类的组件数量
  const categoryCounts: Record<string, number> = {
    content: categories[0]?.name ? 4 : 0,      // Text, Icon, Divider, Image/Video/Audio
    layout: 3,                                 // Row, Column, Card, List, Tabs, Modal
    interactive: 8,                            // Button(2), TextField, CheckBox(2), Slider, MultipleChoice, DateTimeInput
    plugins: 0                                 // M3+
  }

  const totalCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)

  return (
    <aside className="w-64 bg-surface-container-low/80 backdrop-blur-xl p-6 space-y-4 overflow-y-auto no-scrollbar border-r border-outline-variant/10">
      {/* 全部选项 */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
          selectedCategory === null
            ? 'bg-primary-container text-on-primary-container shadow-sm'
            : 'hover:bg-surface-container-lowest text-on-surface'
        }`}
      >
        <div className="font-serif text-base">全部组件</div>
        <div className="text-xs mt-1 opacity-60">
          {totalCount} 个示例
        </div>
      </button>

      {/* 分隔线（使用背景色阶） */}
      <div className="h-px bg-outline-variant/15 mx-2" />

      {/* 分类列表 */}
      {categories.map((category) => {
        const count = categoryCounts[category.id] || 0
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
              selectedCategory === category.id
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'hover:bg-surface-container-lowest text-on-surface'
            }`}
          >
            <div className="font-serif text-base">{category.name}</div>
            <div className="text-xs mt-1 opacity-60">{category.description}</div>
            <div className="text-xs mt-1 opacity-40">{count} 个示例</div>
          </button>
        )
      })}
    </aside>
  )
}
