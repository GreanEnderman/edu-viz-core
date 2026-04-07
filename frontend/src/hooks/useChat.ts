import { useEffect } from 'react'
import { useA2UI, type ServerToClientMessage } from '@a2ui/react'
import { useChatStore, genId } from '../store/chatStore'
import { remapSurfaceId } from '../a2ui-engine/StreamSplitter'
import { streamChat } from '../api/chat'

export function useChat() {
  const { processMessages, clearSurfaces } = useA2UI()
  const { sendMessage, appendChunk, finishMessage, addA2UIMessage, updateConversationTitle, setError } = useChatStore()

  const currentId = useChatStore((s) => s.currentId)
  const conversations = useChatStore((s) => s.conversations)

  // 当切换对话时，重放历史 A2UI 消息
  useEffect(() => {
    if (!currentId) return
    const conv = conversations.find((c) => c.id === currentId)
    if (!conv) return

    const a2uiMsgs = conv.messages.filter((m) => m.type === 'a2ui')
    if (a2uiMsgs.length === 0) return

    // 清除旧对话的 surfaces
    clearSurfaces()

    // 重放每条 A2UI 消息（lines 中已包含重映射后的 surfaceId）
    for (const msg of a2uiMsgs) {
      if (msg.type !== 'a2ui' || !msg.lines.length) continue
      for (const line of msg.lines) {
        try {
          const parsed = JSON.parse(line) as ServerToClientMessage
          processMessages([parsed])
        } catch {
          // malformed a2ui line — ignore
        }
      }
    }
  }, [currentId]) // 仅在对话切换时触发

  const handleSend = async (text: string) => {
    await sendMessage(text)

    const state = useChatStore.getState()
    const conv = state.conversations.find((c) => c.id === state.currentId)
    const msgs = conv?.messages ?? []
    const history = msgs
      .filter((m) => m.type === 'text' && !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.type === 'text' ? m.content : '' }))

    const convId = useChatStore.getState().currentId

    // 每次回复使用独立的 surfaceId，避免覆盖之前生成的组件
    let currentSurfaceId: string | null = null

    streamChat(
      [...history, { role: 'user' as const, content: text }],
      {
        onChunk: (chunk) => appendChunk(chunk),
        onA2UILine: (line) => {
          try {
            // 首条 A2UI 线到达时，生成唯一 surfaceId 并创建 A2UI 消息
            if (!currentSurfaceId) {
              currentSurfaceId = genId()
              addA2UIMessage(currentSurfaceId)
            }
            // 将 "main" 重映射为独立 surfaceId
            const remappedLine = remapSurfaceId(line, currentSurfaceId)
            const msg = JSON.parse(remappedLine) as ServerToClientMessage
            processMessages([msg])
          } catch {
            // malformed a2ui line — ignore
          }
        },
        onDone: () => {
          currentSurfaceId = null
          finishMessage()
        },
        onTitle: (title) => updateConversationTitle(title),
        onError: (err) => setError(err.message),
      },
      convId ? { conversationId: convId } : undefined,
    )
  }

  return { handleSend }
}
