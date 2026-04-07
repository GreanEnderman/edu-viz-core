import { splitSSELine } from '../a2ui-engine/StreamSplitter'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onA2UILine: (line: string) => void
  onTitle: (title: string) => void
  onDone: () => void
  onError: (err: Error) => void
}

export interface StreamOptions {
  conversationId?: string
}

const MOCK_RESPONSE_PART1 = `很好的问题！让我来解释一下。

简谐运动是一种周期性运动，其中物体受到与位移成正比且方向相反的回复力。这种运动可以用正弦或余弦函数来描述。

**核心公式：**
x(t) = A·cos(ωt + φ)

其中 A 是振幅，ω 是角频率，φ 是初相位。

下面是简谐运动的物理流程：

\`\`\`mermaid
graph TD
    A["物体偏离平衡位置"] -->|"产生回复力 F = -kx"| B["回复力指向平衡位置"]
    B --> C["物体向平衡位置加速运动"]
    C -->|"到达平衡位置"| D["速度最大，加速度为零"]
    D -->|"惯性使物体继续运动"| E["物体越过平衡位置"]
    E -->|"位移方向改变"| A
\`\`\`

下面是一个交互演示：`

const MOCK_RESPONSE_PART2 = `

你可以尝试调整上面的参数来观察振幅和频率的变化。

**关键要点：**
- 回复力始终指向平衡位置
- 运动具有周期性和对称性
- 能量在动能和势能之间转换`

// A2UI v0.8: beginRendering must precede surfaceUpdate to initialize the surface
const MOCK_A2UI_BEGIN = JSON.stringify({
  beginRendering: {
    surfaceId: 'main',
    root: 'c1',
  },
})

const MOCK_A2UI_UPDATE = JSON.stringify({
  surfaceUpdate: {
    surfaceId: 'main',
    components: [
      {
        id: 'c1',
        component: {
          Text: {
            text: { literalString: '振幅 A = 1.0 m，角频率 ω = 2π rad/s' },
            usageHint: 'body',
          },
        },
      },
    ],
  },
})

async function mockStream(callbacks: StreamCallbacks): Promise<void> {
  // 先流式输出第一段文字
  const chars1 = MOCK_RESPONSE_PART1.split('')
  for (const char of chars1) {
    await new Promise((r) => setTimeout(r, 18))
    callbacks.onChunk(char)
  }
  // 发送 A2UI 组件
  await new Promise((r) => setTimeout(r, 80))
  callbacks.onA2UILine(MOCK_A2UI_BEGIN)
  await new Promise((r) => setTimeout(r, 20))
  callbacks.onA2UILine(MOCK_A2UI_UPDATE)
  // 再流式输出第二段文字（A2UI 之后的文字，验证穿插效果）
  await new Promise((r) => setTimeout(r, 60))
  const chars2 = MOCK_RESPONSE_PART2.split('')
  for (const char of chars2) {
    await new Promise((r) => setTimeout(r, 18))
    callbacks.onChunk(char)
  }
  callbacks.onTitle('简谐运动解析')
  callbacks.onDone()
}

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  options?: StreamOptions
): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    return mockStream(callbacks)
  }

  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        ...(options?.conversationId ? { conversation_id: options.conversationId } : {}),
      }),
    })
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!response.ok) {
    callbacks.onError(new Error(`HTTP ${response.status}: ${response.statusText}`))
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError(new Error('No response body'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const result = splitSSELine(line)
        if (result.type === 'text') {
          callbacks.onChunk(result.content)
        } else if (result.type === 'a2ui') {
          callbacks.onA2UILine(result.line)
        } else if (result.type === 'title') {
          callbacks.onTitle(result.content)
        } else if (result.type === 'done') {
          callbacks.onDone()
          return
        }
      }
    }
    callbacks.onDone()
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  } finally {
    reader.releaseLock()
  }
}
