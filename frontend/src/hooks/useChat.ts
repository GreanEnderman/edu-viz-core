import { useEffect } from 'react'
import { useA2UI, type ServerToClientMessage } from '@a2ui/react'
import { remapSurfaceId } from '../a2ui-engine/StreamSplitter'
import { streamChat } from '../services/chatService'
import { useChatStore } from '../store/chatStore'
import type { TextMessage } from '../types/chat'
import { genMessageId } from '../utils/chatMessages'

export function useChat() {
  const { processMessages, clearSurfaces } = useA2UI()
  const { sendMessage, appendChunk, finishMessage, addA2UIMessage, updateConversationTitle, setError } =
    useChatStore()

  const currentId = useChatStore((state) => state.currentId)
  const conversations = useChatStore((state) => state.conversations)

  useEffect(() => {
    if (!currentId) return

    const conversation = conversations.find((item) => item.id === currentId)
    if (!conversation) return

    const a2uiMessages = conversation.messages.filter((message) => message.type === 'a2ui')
    if (a2uiMessages.length === 0) return

    clearSurfaces()

    for (const message of a2uiMessages) {
      if (message.type !== 'a2ui' || message.lines.length === 0) continue

      for (const line of message.lines) {
        try {
          processMessages([JSON.parse(line) as ServerToClientMessage])
        } catch {
          // Ignore malformed A2UI payloads from persisted records.
        }
      }
    }
  }, [clearSurfaces, conversations, currentId, processMessages])

  const handleSend = async (text: string) => {
    await sendMessage(text)

    const state = useChatStore.getState()
    const conversation = state.conversations.find((item) => item.id === state.currentId)
    const history =
      conversation?.messages
        .filter((message): message is TextMessage => message.type === 'text' && !message.isStreaming)
        .map((message) => ({ role: message.role, content: message.content })) ?? []

    let currentSurfaceId: string | null = null

    streamChat(
      [...history, { role: 'user', content: text }],
      {
        onChunk: appendChunk,
        onA2UILine: (line) => {
          try {
            if (!currentSurfaceId) {
              currentSurfaceId = genMessageId()
              addA2UIMessage(currentSurfaceId)
            }

            const remappedLine = remapSurfaceId(line, currentSurfaceId)
            processMessages([JSON.parse(remappedLine) as ServerToClientMessage])
          } catch {
            // Ignore malformed A2UI lines.
          }
        },
        onDone: () => {
          currentSurfaceId = null
          finishMessage()
        },
        onTitle: updateConversationTitle,
        onError: (error) => setError(error.message),
      },
      state.currentId ? { conversationId: state.currentId } : undefined,
    )
  }

  return { handleSend }
}
