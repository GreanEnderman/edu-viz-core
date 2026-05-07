import { useEffect, useRef, useState } from 'react'

export interface UseTypewriterOptions {
  charDelay?: number
  minCharDelay?: number
}

function findMathBlockEnd(text: string, startIndex: number): number | null {
  if (startIndex >= text.length) return null

  if (text[startIndex] === '$' && text[startIndex + 1] === '$') {
    const closeIndex = text.indexOf('$$', startIndex + 2)
    return closeIndex === -1 ? null : closeIndex + 2
  }

  if (text[startIndex] !== '$') {
    return null
  }

  const nextChar = text[startIndex + 1]
  if (nextChar === undefined || nextChar === '$' || nextChar === ' ' || nextChar === '\n' || nextChar === '\r') {
    return null
  }

  let searchIndex = startIndex + 1
  while (searchIndex < text.length) {
    const found = text.indexOf('$', searchIndex)
    if (found === -1) return null

    if (text[found + 1] === '$') {
      searchIndex = found + 2
      continue
    }

    const charBefore = text[found - 1]
    if (charBefore === ' ' || charBefore === '\n' || charBefore === '\r') {
      searchIndex = found + 1
      continue
    }

    return found + 1
  }

  return null
}

export function useTypewriter(
  content: string,
  isStreaming: boolean,
  options: UseTypewriterOptions = {},
) {
  const { charDelay = 45, minCharDelay = 5 } = options
  const indexRef = useRef(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const rafIdRef = useRef(0)
  const lastTickRef = useRef(0)
  const contentRef = useRef(content)
  const isStreamingRef = useRef(isStreaming)
  const prevContentLengthRef = useRef(0)

  useEffect(() => {
    contentRef.current = content
    isStreamingRef.current = isStreaming
  }, [content, isStreaming])

  useEffect(() => {
    if (content.length === 0 && prevContentLengthRef.current > 0) {
      indexRef.current = 0
      requestAnimationFrame(() => setDisplayedIndex(0))
    }

    prevContentLengthRef.current = content.length
  }, [content.length])

  useEffect(() => {
    if (!isStreaming && content.length > 0) {
      indexRef.current = content.length
      requestAnimationFrame(() => setDisplayedIndex(content.length))
    }
  }, [content.length, isStreaming])

  useEffect(() => {
    if (!isStreaming) return

    const animate = (timestamp: number) => {
      const currentContent = contentRef.current
      const backlog = currentContent.length - indexRef.current

      if (backlog > 0) {
        let delay = charDelay
        if (backlog > 50) {
          delay = minCharDelay
        } else if (backlog > 20) {
          delay = minCharDelay + (charDelay - minCharDelay) * (1 - (backlog - 20) / 30)
        }

        if (timestamp - lastTickRef.current >= delay) {
          const mathEnd = findMathBlockEnd(currentContent, indexRef.current)
          if (mathEnd !== null) {
            indexRef.current = mathEnd
          } else {
            const advance = backlog > 100 ? Math.min(3, backlog) : 1
            indexRef.current = Math.min(indexRef.current + advance, currentContent.length)
          }

          setDisplayedIndex(indexRef.current)
          lastTickRef.current = timestamp
        }
      }

      if (isStreamingRef.current) {
        rafIdRef.current = requestAnimationFrame(animate)
      }
    }

    lastTickRef.current = performance.now()
    rafIdRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafIdRef.current)
  }, [charDelay, isStreaming, minCharDelay])

  return {
    displayedContent: content.slice(0, Math.min(displayedIndex, content.length)),
    isTyping: isStreaming && displayedIndex < content.length,
  }
}
