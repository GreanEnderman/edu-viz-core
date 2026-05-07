import { useRef, useEffect, createContext, useContext, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { useTypewriter } from '../../hooks/useTypewriter'
import { MermaidDiagram } from './MermaidDiagram'

// Context 用于向 react-markdown 子组件传递 isStreaming 状态
const StreamingContext = createContext(false)

interface TextBubbleProps {
  content: string
  isStreaming: boolean
  role: 'user' | 'assistant'
}

export function TextBubble({ content, isStreaming, role }: TextBubbleProps) {
  const { displayedContent, isTyping } = useTypewriter(content, isStreaming)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef(0)

  // 打字机驱动的节流滚动
  useEffect(() => {
    if (!isTyping) return
    const now = Date.now()
    if (now - lastScrollRef.current > 150) {
      const scrollParent = containerRef.current?.closest('.overflow-y-auto')
      if (scrollParent) {
        scrollParent.scrollTop = scrollParent.scrollHeight
      }
      lastScrollRef.current = now
    }
  }, [isTyping])

  if (role === 'user') {
    return (
      <div className="space-y-4 mb-12">
        <div className="border-l-2 border-secondary/20 pl-8 py-2">
          <p className="font-sans text-primary/70 text-lg leading-relaxed italic">
            {content}
          </p>
        </div>
      </div>
    )
  }

  // 空的非流式 assistant 消息不渲染（如 A2UI 后无后续文本的空 TextMessage）
  if (!content && !isStreaming) return null

  // Assistant message — editorial layout
  // 流式阶段用 displayedContent（打字机控制），结束后用完整 content
  const displayText = isStreaming ? displayedContent : content

  const lines = displayText.split('\n')
  const headingMatch = lines.find((l) => l.startsWith('# ') || l.startsWith('## '))
  const headline = headingMatch
    ? headingMatch.replace(/^#+\s*/, '')
    : null
  const bodyContent = headingMatch
    ? displayText.replace(headingMatch, '').trim()
    : displayText

  return (
    <div className="space-y-10 mb-16" ref={containerRef}>
      {headline ? (
        <div className="text-center space-y-4">
          <h3 className="font-serif text-3xl text-primary leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{headline}</ReactMarkdown>
              </h3>
          <div className="h-[1px] w-24 bg-secondary-fixed-dim mx-auto opacity-30" />
        </div>
      ) : null}
      <div className="font-serif text-on-surface-variant leading-relaxed text-lg space-y-6 max-w-3xl mx-auto">
        <StreamingContext.Provider value={isStreaming}>
          <div className="prose prose-lg max-w-none text-left prose-headings:font-serif prose-headings:text-primary prose-p:text-on-surface-variant prose-strong:text-primary prose-p:font-serif">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{ code: CodeBlock, pre: PreBlock }}>{bodyContent}</ReactMarkdown>
          </div>
        </StreamingContext.Provider>
        {isStreaming && (
          <span className="inline-block w-0.5 h-5 ml-1 bg-on-surface-variant align-middle animate-blink" />
        )}
      </div>
    </div>
  )
}

// react-markdown 自定义 pre 组件：mermaid 代码块去掉 prose 深色背景
function PreBlock({ children, ...rest }: ComponentPropsWithoutRef<'pre'>) {
  // children 是 <code> 元素，检查其 className 是否含 language-mermaid
  const child = Array.isArray(children) ? children[0] : children
  const codeEl = child as React.ReactElement<{ className?: string }>
  const isMermaid = /language-mermaid/.test(codeEl?.props?.className || '')

  if (isMermaid) {
    // mermaid 块：不渲染 <pre>，避免 prose 的深色背景
    return <>{children}</>
  }

  return <pre {...rest}>{children}</pre>
}

// react-markdown 自定义 code 组件：检测 mermaid 代码块并渲染图表
function CodeBlock({ className, children, ...rest }: ComponentPropsWithoutRef<'code'>) {
  const isStreaming = useContext(StreamingContext)
  const match = /language-(\w+)/.exec(className || '')
  const language = match?.[1]
  const codeContent = String(children).replace(/\n$/, '')

  if (language === 'mermaid') {
    return <MermaidDiagram definition={codeContent} isStreaming={isStreaming} />
  }

  // 非 mermaid 代码块：保持默认渲染
  return <code className={className} {...rest}>{children}</code>
}
