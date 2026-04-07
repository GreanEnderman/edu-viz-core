import { useState, useEffect, useRef } from 'react'

export interface UseTypewriterOptions {
  /** 基础每字符延迟(ms)，默认 30 */
  charDelay?: number
  /** 追赶时的最小延迟(ms)，默认 5 */
  minCharDelay?: number
}

export function useTypewriter(
  content: string,
  isStreaming: boolean,
  options: UseTypewriterOptions = {}
) {
  const { charDelay = 45, minCharDelay = 5 } = options

  // 用 ref 追踪实际 index，用 state 触发重渲染
  const indexRef = useRef(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const rafIdRef = useRef(0)
  const lastTickRef = useRef(0)
  const contentRef = useRef(content)
  const isStreamingRef = useRef(isStreaming)
  const prevContentLenRef = useRef(0)

  // 保持 refs 同步
  contentRef.current = content
  isStreamingRef.current = isStreaming

  // 检测内容重置（新消息开始）
  useEffect(() => {
    if (content.length === 0 && prevContentLenRef.current > 0) {
      indexRef.current = 0
      setDisplayedIndex(0)
    }
    prevContentLenRef.current = content.length
  }, [content.length])

  // 流结束时立即显示全部内容
  useEffect(() => {
    if (!isStreaming && content.length > 0) {
      indexRef.current = content.length
      setDisplayedIndex(content.length)
    }
  }, [isStreaming, content.length])

  // 主动画循环
  useEffect(() => {
    if (!isStreaming) return

    const animate = (timestamp: number) => {
      const currentContent = contentRef.current
      const backlog = currentContent.length - indexRef.current

      if (backlog > 0) {
        // 自适应延迟：积压越多越快
        let delay = charDelay
        if (backlog > 50) {
          delay = minCharDelay
        } else if (backlog > 20) {
          delay = minCharDelay + (charDelay - minCharDelay) * (1 - (backlog - 20) / 30)
        }

        if (timestamp - lastTickRef.current >= delay) {
          // 大积压时每次推进多个字符
          const advance = backlog > 100 ? Math.min(3, backlog) : 1
          indexRef.current = Math.min(indexRef.current + advance, currentContent.length)
          setDisplayedIndex(indexRef.current)
          lastTickRef.current = timestamp
        }
      }

      // 流仍在进行则继续循环
      if (isStreamingRef.current) {
        rafIdRef.current = requestAnimationFrame(animate)
      }
    }

    lastTickRef.current = performance.now()
    rafIdRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafIdRef.current)
  }, [isStreaming, charDelay, minCharDelay])

  const displayedContent = content.slice(0, Math.min(displayedIndex, content.length))
  const isTyping = isStreaming && displayedIndex < content.length

  return { displayedContent, isTyping }
}
