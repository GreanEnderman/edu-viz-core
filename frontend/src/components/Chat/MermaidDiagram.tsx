import { useEffect, useRef, useState, useId } from 'react'

interface MermaidDiagramProps {
  definition: string
  isStreaming: boolean
}

let mermaidInitialized = false
let idCounter = 0

/**
 * 自动纠正 LLM 生成的常见 mermaid 语法错误：
 * 1. 单箭头 `->`  → 双箭头 `-->`
 * 2. 带标签的单箭头 `- 标签 ->` → 双箭头 `-- 标签 -->`
 */
function fixMermaidDefinition(definition: string): string {
  const lines = definition.split('\n')
  const fixed = lines.map((line) => {
    // 跳过图表声明行 (graph TD, flowchart LR 等)
    if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitgraph)/i.test(line.trim())) {
      return line
    }
    // 修复: `- 标签 ->` → `-- 标签 -->`
    // 匹配: `X - text ->` 或 `X -text->`  (标签在两个 -> 之间)
    let fixed = line
      // 先修复带标签的箭头: `nodeA - label -> nodeB` → `nodeA -- label --> nodeB`
      .replace(/(\s)-\s+(.+?)\s*->(\s)/g, '$1-- $2 -->$3')
      // 再修复普通单箭头: `->` → `-->`（跳过已有的 `-->`）
      .replace(/(?<!-)->/g, '-->')
    return fixed
  })
  return fixed.join('\n')
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
  const [error, setError] = useState(false)
  const renderIdRef = useRef(`mermaid-${reactId}-${++idCounter}`)

  useEffect(() => {
    if (isStreaming) return

    let cancelled = false
    const id = renderIdRef.current

    async function render() {
      try {
        await ensureMermaidReady()
        if (cancelled) return
        const mermaid = (await import('mermaid')).default
        if (cancelled) return
        // Clean up previous render output
        document.getElementById(id)?.remove()
        const fixedDefinition = fixMermaidDefinition(definition)
        const { svg: svgStr } = await mermaid.render(id, fixedDefinition)
        if (!cancelled) {
          setSvg(svgStr)
          setError(false)
        }
      } catch {
        if (!cancelled) {
          setSvg(null)
          setError(true)
        }
        // Clean up mermaid's temp element on error
        document.getElementById(id)?.remove()
      }
    }

    render()

    return () => {
      cancelled = true
      document.getElementById(id)?.remove()
    }
  }, [definition, isStreaming])

  // Streaming: show placeholder
  if (isStreaming) {
    return (
      <div className="mermaid-loading">
        <span className="material-symbols-outlined text-2xl mb-2 block">schema</span>
        图表渲染中...
      </div>
    )
  }

  // Error: show raw code fallback
  if (error) {
    return (
      <div className="mermaid-error">
        <div className="mermaid-error-label">图表源码（渲染失败）</div>
        <pre>{definition}</pre>
      </div>
    )
  }

  // Rendered SVG
  if (svg) {
    return (
      <div className="mermaid-container" ref={containerRef}>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    )
  }

  // Loading (mermaid library loading)
  return (
    <div className="mermaid-loading">
      <span className="material-symbols-outlined text-2xl mb-2 block">schema</span>
      加载图表引擎...
    </div>
  )
}
