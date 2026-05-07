import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ComponentCard } from './ComponentCard'
import { componentExamples } from './componentExamples'
import { showcaseCategories } from './showcaseData'
import { pluginGalleryExamples } from './pluginGalleryRegistry'
import type { ComponentExample } from './showcaseData'

/**
 * A2UI 组件预览库主页面
 * 提供所有已注册组件的可视化预览
 */
export function ComponentGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Merge static examples with dynamically registered plugin examples
  const allExamples: ComponentExample[] = [
    ...componentExamples,
    ...pluginGalleryExamples,
  ]

  // 根据选中的分类过滤组件示例
  const filteredExamples = selectedCategory
    ? allExamples.filter(ex => ex.category.id === selectedCategory)
    : allExamples

  return (
    <div className="h-screen overflow-hidden bg-surface text-on-surface flex flex-col">
      {/* 顶部栏 */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-outline-variant/15 bg-surface">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-2xl text-primary">A2UI 组件预览库</h1>
          <span className="text-xs text-on-surface/50 bg-surface-container-low px-2 py-1 rounded-md">
            开发模式
          </span>
        </div>
        <a
          href="/"
          className="text-sm text-secondary hover:underline font-sans transition-colors"
        >
          返回主界面 →
        </a>
      </header>

      {/* 主布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar
          categories={showcaseCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* 组件网格 */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* 当前分类标题 */}
            <div className="mb-6">
              <h2 className="font-serif text-xl text-primary">
                {selectedCategory
                  ? showcaseCategories.find((c) => c.id === selectedCategory)?.name
                  : '全部组件'}
              </h2>
              <p className="text-sm text-on-surface/60 font-sans mt-1">
                共 {filteredExamples.length} 个示例
              </p>
            </div>

            {/* 组件网格 */}
            {filteredExamples.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExamples.map(example => (
                  <ComponentCard key={example.id} example={example} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-on-surface/50">
                <p className="font-serif text-lg">该分类暂无组件示例</p>
                <p className="text-sm mt-2">请选择其他分类或等待后续更新</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
