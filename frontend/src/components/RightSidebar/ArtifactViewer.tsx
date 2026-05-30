/**
 * 当前产物查看器
 * 显示代码片段或其他学习产物
 */

import type { Artifact } from '../../types/appFlow'

interface ArtifactViewerProps {
  artifact: Artifact | null
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  if (!artifact) {
    return null
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-float animate-fade-in">
      {/* 标题栏 */}
      <div className="bg-primary-container px-4 py-2 flex items-center justify-between">
        <span className="font-sans text-xs font-medium text-on-primary uppercase tracking-wider">
          {artifact.title}
        </span>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
      </div>

      {/* 代码内容 */}
      <div className="bg-primary-container px-4 py-4">
        <pre className="font-mono text-sm text-on-primary leading-relaxed">
          {artifact.content}
        </pre>
      </div>
    </div>
  )
}
