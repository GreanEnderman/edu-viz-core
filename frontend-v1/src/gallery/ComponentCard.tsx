import { useEffect } from 'react'
import { A2UIRenderer, useA2UIActions } from '@a2ui/react'
import type { ComponentExample } from './showcaseData'

interface ComponentCardProps {
  example: ComponentExample
}

/**
 * 单个组件预览卡片
 * 显示组件的实时预览和说明信息
 */
export function ComponentCard({ example }: ComponentCardProps) {
  const { processMessages } = useA2UIActions()

  useEffect(() => {
    // 组件挂载时注入预定义的 A2UI 消息
    processMessages(example.messages)
  }, [example.surfaceId, example.messages, processMessages])

  return (
    <div
      className="bg-surface-container-lowest rounded-2xl overflow-hidden transition-all hover:scale-[1.02] duration-300"
      style={{ boxShadow: '0px 20px 40px rgba(27, 28, 26, 0.06)' }}
    >
      {/* 预览区域 */}
      <div className="p-6 min-h-[160px] flex items-center justify-center bg-surface-container-low">
        <A2UIRenderer surfaceId={example.surfaceId} />
      </div>

      {/* 信息区域 */}
      <div className="px-6 py-4 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg text-primary">{example.name}</h3>
          {example.pluginName && (
            <span className="text-[10px] font-sans text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
              {example.pluginName}
            </span>
          )}
        </div>
        <p className="text-sm text-on-surface/70 font-sans">{example.description}</p>
      </div>
    </div>
  )
}
