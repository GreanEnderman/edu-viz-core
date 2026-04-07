import { A2UIRenderer, useA2UI } from '@a2ui/react'

interface A2UISurfaceProps {
  surfaceId: string
}

export function A2UISurface({ surfaceId }: A2UISurfaceProps) {
  const { getSurface } = useA2UI()
  const surface = getSurface(surfaceId)

  // 无 componentTree 时不渲染（空组件隐藏）
  if (!surface?.componentTree) return null

  return (
    <div className="flex justify-center mt-4 mb-12">
      <div
        className="max-w-[80%] min-h-8 rounded-xl p-6"
        style={{ boxShadow: '0px 20px 40px rgba(27, 28, 26, 0.06)' }}
      >
        <A2UIRenderer surfaceId={surfaceId} />
      </div>
    </div>
  )
}
