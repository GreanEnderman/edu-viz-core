import { requestJson, requestVoid } from './http'
import type { ConversationResponse, MessageResponse } from '../types/chat'

export function createConversation() {
  return requestJson<ConversationResponse>('/v1/conversations', { method: 'POST' })
}

export function listConversations() {
  return requestJson<ConversationResponse[]>('/v1/conversations')
}

export function getMessages(conversationId: string) {
  return requestJson<MessageResponse[]>(`/v1/conversations/${conversationId}/messages`)
}

export function deleteConversation(conversationId: string) {
  return requestVoid(`/v1/conversations/${conversationId}`, { method: 'DELETE' })
}
