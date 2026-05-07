import { parseMixedContentOrdered, remapSurfaceId } from '../a2ui-engine/StreamSplitter'
import type {
  A2UIMessage,
  Conversation,
  ConversationResponse,
  Message,
  MessageResponse,
  TextMessage,
} from '../types/chat'

let idCounter = 0

export function genMessageId(): string {
  return `msg-${Date.now()}-${idCounter++}`
}

export function createConversationRecord(conversation: ConversationResponse): Conversation {
  return {
    ...conversation,
    messages: [],
  }
}

export function createTextMessage(
  role: TextMessage['role'],
  content: string,
  options?: Partial<Pick<TextMessage, 'id' | 'isStreaming'>>,
): TextMessage {
  return {
    id: options?.id ?? genMessageId(),
    role,
    type: 'text',
    content,
    isStreaming: options?.isStreaming ?? false,
  }
}

export function createA2UIMessage(surfaceId: string, lines: string[] = []): A2UIMessage {
  return {
    id: genMessageId(),
    role: 'assistant',
    type: 'a2ui',
    surfaceId,
    lines,
  }
}

export function buildConversationMessages(messageRows: MessageResponse[]): Message[] {
  return messageRows.flatMap((messageRow) => {
    if (messageRow.role === 'user') {
      return [createTextMessage('user', messageRow.content, { id: messageRow.id })]
    }

    return parseMixedContentOrdered(messageRow.content).map((segment) => {
      if (segment.type === 'text') {
        return createTextMessage('assistant', segment.content)
      }

      const surfaceId = genMessageId()
      return createA2UIMessage(
        surfaceId,
        segment.lines.map((line) => remapSurfaceId(line, surfaceId)),
      )
    })
  })
}
