import { create } from 'zustand'

import * as convApi from '../api/conversations'
import { parseMixedContentOrdered, remapSurfaceId } from '../a2ui-engine/StreamSplitter'

export type MessageRole = 'user' | 'assistant'

export interface TextMessage {
  id: string
  role: MessageRole
  type: 'text'
  content: string
  isStreaming: boolean
}

export interface A2UIMessage {
  id: string
  role: 'assistant'
  type: 'a2ui'
  surfaceId: string  // 每条 A2UI 消息的独立 surface ID
  lines: string[]    // A2UI JSONL 数据（已重映射 surfaceId），用于重放
}

export type Message = TextMessage | A2UIMessage

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: Message[]
}

interface ChatState {
  conversations: Conversation[]
  currentId: string | null
  isLoading: boolean
  error: string | null
  activeStreamingId: string | null  // 当前接收流式文本的 TextMessage ID

  // conversation management
  createConversation: () => Promise<string>
  switchConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  loadConversations: () => Promise<void>

  // message operations
  sendMessage: (userContent: string) => Promise<void>
  appendChunk: (chunk: string) => void
  finishMessage: () => void
  addA2UIMessage: (surfaceId: string) => void
  updateConversationTitle: (title: string) => void
  setError: (msg: string) => void
  clearError: () => void
}

let idCounter = 0
export const genId = () => `msg-${Date.now()}-${idCounter++}`

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentId: null,
  isLoading: false,
  error: null,
  activeStreamingId: null,

  // --- conversation management ---

  createConversation: async () => {
    try {
      const res = await convApi.createConversation()
      const conv: Conversation = { id: res.id, title: res.title, created_at: res.created_at, updated_at: res.updated_at, messages: [] }
      set((state) => ({
        conversations: [conv, ...state.conversations],
        currentId: res.id,
      }))
      return res.id
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) })
      throw err
    }
  },

  switchConversation: async (id: string) => {
    const { conversations } = get()
    if (!conversations.find((c) => c.id === id)) {
      set({ error: 'Conversation not found' })
      return
    }
    try {
      const msgRows = await convApi.getMessages(id)
      const messages: Message[] = []

      for (const m of msgRows) {
        if (m.role === 'user') {
          messages.push({
            id: m.id,
            role: 'user',
            type: 'text',
            content: m.content,
            isStreaming: false,
          })
          continue
        }

        // assistant 消息：解析混合内容，保留文本与 A2UI 的交错顺序
        const segments = parseMixedContentOrdered(m.content)

        for (const seg of segments) {
          if (seg.type === 'text') {
            messages.push({
              id: genId(),
              role: 'assistant',
              type: 'text',
              content: seg.content,
              isStreaming: false,
            })
          } else {
            const surfaceId = genId()
            messages.push({
              id: genId(),
              role: 'assistant',
              type: 'a2ui',
              surfaceId,
              lines: seg.lines.map((l) => remapSurfaceId(l, surfaceId)),
            })
          }
        }
      }

      set((state) => ({
        currentId: id,
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, messages } : c
        ),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) })
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await convApi.deleteConversation(id)
      set((state) => {
        const filtered = state.conversations.filter((c) => c.id !== id)
        return {
          conversations: filtered,
          currentId: state.currentId === id ? null : state.currentId,
        }
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) })
    }
  },

  loadConversations: async () => {
    try {
      const list = await convApi.listConversations()
      const conversations: Conversation[] = list.map((c) => ({
        id: c.id,
        title: c.title,
        created_at: c.created_at,
        updated_at: c.updated_at,
        messages: [],
      }))
      set({ conversations })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) })
    }
  },

  // --- message operations ---

  sendMessage: async (userContent: string) => {
    let currentId = get().currentId
    // auto-create conversation if none active (await to get real backend ID)
    if (!currentId) {
      currentId = await get().createConversation()
    }

    const userId = genId()
    const assistantId = genId()
    const userMsg: TextMessage = { id: userId, role: 'user', type: 'text', content: userContent, isStreaming: false }
    const assistantMsg: TextMessage = { id: assistantId, role: 'assistant', type: 'text', content: '', isStreaming: true }

    set((state) => ({
      isLoading: true,
      error: null,
      activeStreamingId: assistantId,
      conversations: state.conversations.map((c) =>
        c.id === currentId
          ? { ...c, messages: [...c.messages, userMsg, assistantMsg] }
          : c
      ),
    }))
  },

  appendChunk: (chunk: string) => {
    const { currentId, activeStreamingId } = get()
    if (!currentId || !activeStreamingId) return
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === currentId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === activeStreamingId && m.type === 'text'
                  ? { ...m, content: m.content + chunk }
                  : m
              ),
            }
          : c
      ),
    }))
  },

  finishMessage: () => {
    const { currentId, activeStreamingId } = get()
    if (!currentId || !activeStreamingId) return
    set((state) => ({
      isLoading: false,
      activeStreamingId: null,
      conversations: state.conversations.map((c) =>
        c.id === currentId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === activeStreamingId && m.type === 'text'
                  ? { ...m, isStreaming: false }
                  : m
              ),
            }
          : c
      ),
    }))
  },

  addA2UIMessage: (surfaceId: string) => {
    const { currentId, activeStreamingId } = get()
    if (!currentId) return
    const a2uiMsgId = genId()
    const newStreamingId = genId()
    set((state) => ({
      activeStreamingId: newStreamingId,
      conversations: state.conversations.map((c) => {
        if (c.id !== currentId) return c
        // 关闭当前流式 TextMessage，插入 A2UIMsg，再创建新的 TextMessage 接收后续文本
        const updated = c.messages.map((m) =>
          m.id === activeStreamingId && m.type === 'text'
            ? { ...m, isStreaming: false }
            : m
        )
        return {
          ...c,
          messages: [
            ...updated,
            { id: a2uiMsgId, role: 'assistant' as const, type: 'a2ui' as const, surfaceId, lines: [] as string[] },
            { id: newStreamingId, role: 'assistant' as const, type: 'text' as const, content: '', isStreaming: true },
          ],
        }
      }),
    }))
  },

  updateConversationTitle: (title: string) => {
    const { currentId } = get()
    if (!currentId) return
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === currentId ? { ...c, title } : c
      ),
    }))
  },

  setError: (msg: string) => set({ isLoading: false, error: msg }),
  clearError: () => set({ error: null }),
}))
