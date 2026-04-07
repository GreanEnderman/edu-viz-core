import { useState, useEffect, useRef } from 'react'

export interface UseTypewriterOptions {
  /** 基础每字符延迟(ms)，默认 30 */
  charDelay?: number
  /** 追赶时的最小延迟(ms)，默认 5 */
  minCharDelay?: number
}

/**
 * 检测 startIndex 处是否开始一个完整的数学公式块。
 * 返回闭合定界符之后的索引，或 null（不完整/非公式）。
 *
 * 支持 $$...$$（块级）和 $...$（行内）。
 * 行内 $ 的启发式：开头后不能是空白/$，闭合 $ 前不能是空白。
 */
function findMathBlockEnd(text: string, startIndex: number): number | null {
  if (startIndex >= text.length) return null

  // 块级公式 $$...$$
  if (text[startIndex] === '$' && text[startIndex + 1] === '$') {
    const closeIdx = text.indexOf('$$', startIndex + 2)
    return closeIdx !== -1 ? closeIdx + 2 : null
  }

  // 行内公式 $...$
  if (text[startIndex] === '$') {
    const nextChar = text[startIndex + 1]
    if (nextChar === undefined || nextChar === '$' || nextChar === ' ' || nextChar === '\n' || nextChar === '\r') {
      return null
    }

    let searchIdx = startIndex + 1
    while (searchIdx < text.length) {
      const found = text.indexOf('$', searchIdx)
      if (found === -1) return null

      // 跳过 $$ 的一部分
      if (text[found + 1] === '$') {
        searchIdx = found + 2
        continue
      }

      // 闭合 $ 前不能是空白
      const charBefore = text[found - 1]
      if (charBefore === ' ' || charBefore === '\n' || charBefore === '\r') {
        searchIdx = found + 1
        continue
      }

      return found + 1
    }
    return null
  }

  return null
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
          // 公式感知：完整公式块一次性跳过
          const mathEnd = findMathBlockEnd(currentContent, indexRef.current)
          if (mathEnd !== null) {
            indexRef.current = mathEnd
          } else {
            // 大积压时每次推进多个字符
            const advance = backlog > 100 ? Math.min(3, backlog) : 1
            indexRef.current = Math.min(indexRef.current + advance, currentContent.length)
          }
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
