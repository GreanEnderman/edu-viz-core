import { create } from 'zustand'

import * as conversationService from '../services/conversationService'
import type { Conversation } from '../types/chat'
import {
  buildConversationMessages,
  createA2UIMessage,
  createConversationRecord,
  createTextMessage,
  genMessageId,
} from '../utils/chatMessages'

interface ChatState {
  conversations: Conversation[]
  currentId: string | null
  isLoading: boolean
  error: string | null
  activeStreamingId: string | null
  createConversation: () => Promise<string>
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  loadConversations: () => Promise<void>
  sendMessage: (userContent: string) => Promise<void>
  appendChunk: (chunk: string) => void
  finishMessage: () => void
  addA2UIMessage: (surfaceId: string) => void
  updateConversationTitle: (title: string) => void
  setError: (msg: string) => void
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentId: null,
  isLoading: false,
  error: null,
  activeStreamingId: null,

  createConversation: async () => {
    try {
      const conversation = createConversationRecord(await conversationService.createConversation())
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentId: conversation.id,
      }))
      return conversation.id
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  switchConversation: async (id: string) => {
    const { conversations } = get()
    if (!conversations.find((conversation) => conversation.id === id)) {
      set({ error: 'Conversation not found' })
      return
    }

    try {
      const messageRows = await conversationService.getMessages(id)
      const messages = buildConversationMessages(messageRows)

      set((state) => ({
        currentId: id,
        conversations: state.conversations.map((conversation) =>
          conversation.id === id ? { ...conversation, messages } : conversation,
        ),
      }))
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await conversationService.deleteConversation(id)
      set((state) => {
        const conversations = state.conversations.filter((conversation) => conversation.id !== id)
        return {
          conversations,
          currentId: state.currentId === id ? null : state.currentId,
        }
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  loadConversations: async () => {
    try {
      const conversations = (await conversationService.listConversations()).map(createConversationRecord)
      set({ conversations })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
    }
  },

  sendMessage: async (userContent: string) => {
    let currentId = get().currentId
    if (!currentId) {
      currentId = await get().createConversation()
    }

    const assistantId = genMessageId()
    const userMessage = createTextMessage('user', userContent)
    const assistantMessage = createTextMessage('assistant', '', {
      id: assistantId,
      isStreaming: true,
    })

    set((state) => ({
      isLoading: true,
      error: null,
      activeStreamingId: assistantId,
      conversations: state.conversations.map((conversation) =>
        conversation.id === currentId
          ? {
              ...conversation,
              messages: [...conversation.messages, userMessage, assistantMessage],
            }
          : conversation,
      ),
    }))
  },

  appendChunk: (chunk: string) => {
    const { currentId, activeStreamingId } = get()
    if (!currentId || !activeStreamingId) return

    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === currentId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === activeStreamingId && message.type === 'text'
                  ? { ...message, content: message.content + chunk }
                  : message,
              ),
            }
          : conversation,
      ),
    }))
  },

  finishMessage: () => {
    const { currentId, activeStreamingId } = get()
    if (!currentId || !activeStreamingId) return

    set((state) => ({
      isLoading: false,
      activeStreamingId: null,
      conversations: state.conversations.map((conversation) =>
        conversation.id === currentId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === activeStreamingId && message.type === 'text'
                  ? { ...message, isStreaming: false }
                  : message,
              ),
            }
          : conversation,
      ),
    }))
  },

  addA2UIMessage: (surfaceId: string) => {
    const { currentId, activeStreamingId } = get()
    if (!currentId) return

    const nextStreamingId = genMessageId()
    set((state) => ({
      activeStreamingId: nextStreamingId,
      conversations: state.conversations.map((conversation) => {
        if (conversation.id !== currentId) return conversation

        const messages = conversation.messages.map((message) =>
          message.id === activeStreamingId && message.type === 'text'
            ? { ...message, isStreaming: false }
            : message,
        )

        return {
          ...conversation,
          messages: [
            ...messages,
            createA2UIMessage(surfaceId),
            createTextMessage('assistant', '', {
              id: nextStreamingId,
              isStreaming: true,
            }),
          ],
        }
      }),
    }))
  },

  updateConversationTitle: (title: string) => {
    const { currentId } = get()
    if (!currentId) return

    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === currentId ? { ...conversation, title } : conversation,
      ),
    }))
  },

  setError: (msg: string) => set({ isLoading: false, error: msg }),
  clearError: () => set({ error: null }),
}))
