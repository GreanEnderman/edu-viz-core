const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface ConversationResponse {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface MessageResponse {
  id: string
  role: string
  type: string
  content: string
  created_at: string
}

export async function createConversation(): Promise<ConversationResponse> {
  const res = await fetch(`${API_BASE}/v1/conversations`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function listConversations(): Promise<ConversationResponse[]> {
  const res = await fetch(`${API_BASE}/v1/conversations`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getMessages(conversationId: string): Promise<MessageResponse[]> {
  const res = await fetch(`${API_BASE}/v1/conversations/${conversationId}/messages`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/conversations/${conversationId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
