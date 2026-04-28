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
  surfaceId: string
  lines: string[]
}

export type Message = TextMessage | A2UIMessage

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages: Message[]
}

export interface ChatMessagePayload {
  role: MessageRole
  content: string
}

export interface ConversationResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface MessageResponse {
  id: string
  role: MessageRole
  type: string
  content: string
  created_at: string
}
