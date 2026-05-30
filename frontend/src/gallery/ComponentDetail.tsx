import { useEffect, useState } from 'react'
import { A2UIRenderer, useA2UIActions } from '@a2ui/react'
import type { ServerToClientMessage } from '@a2ui/react'
import { componentExamples } from './componentExamples'
import { pluginGalleryExamples } from './pluginGalleryRegistry'
import type { ComponentExample } from './showcaseData'

interface ComponentDetailProps {
  componentId: string
  onBack: () => void
  onNavigateToComponent: (id: string) => void
}

/**
 * 组件详情页
 * 提供沉浸式的组件体验空间
 */
export function ComponentDetail({
  componentId,
  onBack,
  onNavigateToComponent
}: ComponentDetailProps) {
  const { processMessages } = useA2UIActions()

  // 查找组件示例
  const allExamples: ComponentExample[] = [
    ...componentExamples,
    ...pluginGalleryExamples,
  ]
  const example = allExamples.find(ex => ex.id === componentId)

  // 查找相关组件（同分类，最多 3 个）
  const relatedExamples = example
    ? allExamples
        .filter(ex => ex.category.id === example.category.id && ex.id !== example.id)
        .slice(0, 3)
    : []

  // 注入 A2UI 消息
  useEffect(() => {
    if (example) {
      processMessages(example.messages)
    }
  }, [example?.surfaceId, example?.messages, processMessages])

  // 错误处理
  if (!example) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-xl text-on-surface/70 font-serif">组件未找到</p>
          <button
            onClick={onBack}
            className="mt-4 text-secondary hover:underline font-sans"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-surface text-on-surface flex flex-col">
      {/* 顶部导航栏 */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-outline-variant/15">
        <button
          onClick={onBack}
          className="text-sm text-on-surface hover:text-primary transition-colors flex items-center gap-2 font-sans"
        >
          ← 返回列表
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-on-surface/60 font-sans">{example.category.name}</span>
          <a href="/" className="text-sm text-secondary hover:underline font-sans">
            返回主界面 →
          </a>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">

          {/* 1. 组件标题区 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-4xl text-primary">{example.name}</h1>
              {example.pluginName && (
                <span className="text-xs font-sans text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  {example.pluginName}
                </span>
              )}
            </div>
            <p className="text-lg text-on-surface/70 font-sans max-w-2xl">
              {example.description}
            </p>
          </section>

          {/* 2. 交互演示区 */}
          <section className="rounded-[20px] border border-white/20 bg-white/50 p-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-outline-variant mb-6 font-sans">
              交互演示
            </h2>
            <div className="min-h-[300px] flex items-center justify-center bg-surface-container-low rounded-xl p-8">
              <A2UIRenderer surfaceId={example.surfaceId} />
            </div>
          </section>

          {/* 3. A2UI 消息序列 */}
          <section className="rounded-[20px] border border-white/20 bg-white/50 p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-outline-variant mb-4 font-sans">
              A2UI 消息序列
            </h2>
            <div className="space-y-3">
              {example.messages.map((msg, idx) => (
                <MessageBlock key={idx} message={msg} index={idx} />
              ))}
            </div>
          </section>

          {/* 4. 组件元信息 */}
          <section className="rounded-[20px] border border-white/20 bg-white/50 p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-outline-variant mb-4 font-sans">
              组件信息
            </h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-on-surface/60 mb-1 font-sans">组件 ID</dt>
                <dd className="font-mono text-primary">{example.id}</dd>
              </div>
              <div>
                <dt className="text-on-surface/60 mb-1 font-sans">Surface ID</dt>
                <dd className="font-mono text-primary">{example.surfaceId}</dd>
              </div>
              <div>
                <dt className="text-on-surface/60 mb-1 font-sans">分类</dt>
                <dd className="text-on-surface font-sans">{example.category.name}</dd>
              </div>
              <div>
                <dt className="text-on-surface/60 mb-1 font-sans">消息数量</dt>
                <dd className="text-on-surface font-sans">{example.messages.length}</dd>
              </div>
            </dl>
          </section>

          {/* 5. 相关组件推荐 */}
          {relatedExamples.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-outline-variant mb-6 font-sans">
                相关组件
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedExamples.map(related => (
                  <button
                    key={related.id}
                    onClick={() => onNavigateToComponent(related.id)}
                    className="text-left p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
                  >
                    <h3 className="font-serif text-lg text-primary mb-1">{related.name}</h3>
                    <p className="text-sm text-on-surface/60 font-sans">{related.description}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  )
}

/**
 * 消息块组件
 * 展示单条 A2UI 消息，支持折叠/展开
 */
function MessageBlock({ message, index }: { message: ServerToClientMessage; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 获取消息类型
  const messageType = Object.keys(message)[0]

  return (
    <div className="bg-surface-container-low rounded-lg p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm font-mono text-primary">
          #{index + 1} - {messageType}
        </span>
        <span className="text-xs text-on-surface/60 font-sans">
          {isExpanded ? '收起' : '展开'}
        </span>
      </button>

      {isExpanded && (
        <pre className="mt-3 text-xs overflow-x-auto bg-surface rounded p-3">
          <code>{JSON.stringify(message, null, 2)}</code>
        </pre>
      )}
    </div>
  )
}
