export type SplitResult =
  | { type: 'text'; content: string }
  | { type: 'a2ui'; line: string }
  | { type: 'title'; content: string }
  | { type: 'done' }
  | { type: 'unknown' }

// A2UI v0.8 top-level message keys
const A2UI_MESSAGE_KEYS = new Set(['surfaceUpdate', 'dataModelUpdate', 'beginRendering', 'deleteSurface'])

export function splitSSELine(raw: string): SplitResult {
  const dataPrefix = 'data: '
  if (!raw.startsWith(dataPrefix)) return { type: 'unknown' }

  const jsonStr = raw.slice(dataPrefix.length).trim()
  if (!jsonStr) return { type: 'unknown' }

  let parsed: { type?: unknown; content?: unknown; line?: unknown }
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return { type: 'unknown' }
  }

  if (parsed.type === 'text' && typeof parsed.content === 'string') {
    return { type: 'text', content: parsed.content }
  }
  if (parsed.type === 'a2ui' && typeof parsed.line === 'string') {
    return { type: 'a2ui', line: parsed.line }
  }
  if (parsed.type === 'title' && typeof parsed.content === 'string') {
    return { type: 'title', content: parsed.content }
  }
  if (parsed.type === 'done') {
    return { type: 'done' }
  }
  return { type: 'unknown' }
}

/**
 * 检测一行文本是否为 A2UI JSONL 行（与后端 is_a2ui_line 逻辑一致）
 */
export function isA2UILine(text: string): boolean {
  const stripped = text.trim()
  if (!stripped.startsWith('{')) return false
  try {
    const obj = JSON.parse(stripped)
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false
    return Object.keys(obj).some((key) => A2UI_MESSAGE_KEYS.has(key))
  } catch {
    return false
  }
}

/**
 * 将混合了文本和 A2UI JSONL 的内容解析为分离的结果
 */
export function parseMixedContent(content: string): { textLines: string[]; a2uiLines: string[] } {
  const textLines: string[] = []
  const a2uiLines: string[] = []

  for (const line of content.split('\n')) {
    if (isA2UILine(line)) {
      a2uiLines.push(line.trim())
    } else {
      textLines.push(line)
    }
  }

  return { textLines, a2uiLines }
}

/**
 * 将 A2UI JSONL 行中的 "surfaceId":"main" 替换为新的 surfaceId。
 * 用于为每条 A2UI 消息分配独立的 surface，避免组件相互覆盖。
 */
export function remapSurfaceId(line: string, newSurfaceId: string): string {
  return line.replace(/"surfaceId"\s*:\s*"main"/g, `"surfaceId":"${newSurfaceId}"`)
}

/**
 * 有序段落类型：保留文本与 A2UI 的交错顺序
 */
export type OrderedSegment =
  | { type: 'text'; content: string }
  | { type: 'a2ui'; lines: string[] }

/**
 * 将混合了文本和 A2UI JSONL 的内容解析为有序段落，保留交错顺序。
 * 连续的 A2UI 行合并为一个 a2ui segment。
 */
export function parseMixedContentOrdered(content: string): OrderedSegment[] {
  const segments: OrderedSegment[] = []
  let textBuffer: string[] = []

  const flushText = () => {
    const joined = textBuffer.join('\n').trim()
    if (joined) {
      segments.push({ type: 'text', content: joined })
    }
    textBuffer = []
  }

  for (const line of content.split('\n')) {
    if (isA2UILine(line)) {
      flushText()
      const lastSeg = segments[segments.length - 1]
      if (lastSeg && lastSeg.type === 'a2ui') {
        lastSeg.lines.push(line.trim())
      } else {
        segments.push({ type: 'a2ui', lines: [line.trim()] })
      }
    } else {
      textBuffer.push(line)
    }
  }
  flushText()

  return segments
}
