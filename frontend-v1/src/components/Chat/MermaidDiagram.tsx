import { useEffect, useId, useRef, useState } from 'react'

interface MermaidDiagramProps {
  definition: string
  isStreaming: boolean
}

let mermaidInitialized = false
let idCounter = 0

function fixMermaidDefinition(definition: string): string {
  return definition
    .split('\n')
    .map((line) => {
      if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitgraph)/i.test(line.trim())) {
        return line
      }

      return line
        .replace(/(\s)-\s+(.+?)\s*->(\s)/g, '$1-- $2 -->$3')
        .replace(/(?<!-)->/g, '-->')
    })
    .join('\n')
}

async function ensureMermaidReady() {
  if (mermaidInitialized) return

  const mermaid = (await import('mermaid')).default
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      background: 'transparent',
      primaryColor: '#d9e2ff',
      primaryTextColor: '#182544',
      primaryBorderColor: '#c5c6cf',
      lineColor: '#75777e',
      secondaryColor: '#fed488',
      secondaryTextColor: '#261900',
      tertiaryColor: '#efeeea',
      fontFamily: 'Newsreader, Noto Serif SC, serif',
      fontSize: '16px',
    },
    securityLevel: 'loose',
  })

  mermaidInitialized = true
}

export function MermaidDiagram({ definition, isStreaming }: MermaidDiagramProps) {
  const reactId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const renderIdRef = useRef(`mermaid-${reactId}-${++idCounter}`)

  useEffect(() => {
    if (isStreaming) return

    let cancelled = false
    const renderId = renderIdRef.current

    const renderDiagram = async () => {
      try {
        await ensureMermaidReady()
        if (cancelled) return

        const mermaid = (await import('mermaid')).default
        if (cancelled) return

        document.getElementById(renderId)?.remove()
        const fixedDefinition = fixMermaidDefinition(definition)
        const { svg: nextSvg } = await mermaid.render(renderId, fixedDefinition)

        if (!cancelled) {
          setSvg(nextSvg)
          setHasError(false)
        }
      } catch {
        if (!cancelled) {
          setSvg(null)
          setHasError(true)
        }

        document.getElementById(renderId)?.remove()
      }
    }

    void renderDiagram()

    return () => {
      cancelled = true
      document.getElementById(renderId)?.remove()
    }
  }, [definition, isStreaming])

  if (isStreaming) {
    return (
      <div className="mermaid-loading">
        <span className="block mb-2 text-2xl material-symbols-outlined">schema</span>
        图表渲染中...
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-label">图表源码（渲染失败）</div>
        <pre>{definition}</pre>
      </div>
    )
  }

  if (svg) {
    return (
      <div className="mermaid-container" ref={containerRef}>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    )
  }

  return (
    <div className="mermaid-loading">
      <span className="block mb-2 text-2xl material-symbols-outlined">schema</span>
      加载图表引擎...
    </div>
  )
}
