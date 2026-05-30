import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { A2UIRenderer, useA2UI, type ServerToClientMessage } from '@a2ui/react'

interface PblA2UISurfaceProps {
  lines: string[]
  resetKey?: string
}

export function PblA2UISurface({ lines, resetKey = 'default' }: PblA2UISurfaceProps) {
  const { clearSurfaces, processMessages } = useA2UI()

  useEffect(() => {
    clearSurfaces()
    for (const line of lines) {
      try {
        processMessages([JSON.parse(line) as ServerToClientMessage])
      } catch {
        // Ignore malformed A2UI lines from the stream.
      }
    }
  }, [clearSurfaces, lines, processMessages, resetKey])

  return (
    <AnimatePresence initial={false}>
      {lines.length > 0 && (
        <motion.div
          key={`a2ui-${resetKey}-${lines.length}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="mt-2 mb-8 mx-auto max-w-[600px] rounded-lg bg-surface p-6 shadow-[0px_20px_40px_rgba(27,28,26,0.06)]"
        >
          <A2UIRenderer surfaceId="pbl-learning" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
