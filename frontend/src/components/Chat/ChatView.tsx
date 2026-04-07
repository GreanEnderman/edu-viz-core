import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { type Message } from '../../store/chatStore'

interface ChatViewProps {
  messages: Message[]
  onSend: (text: string) => void
  isLoading: boolean
  error?: string | null
}

export function ChatView({ messages, onSend, isLoading, error }: ChatViewProps) {
  return (
    <div className="h-full flex flex-col">
      <MessageList messages={messages} />
      {error && (
        <div className="mx-6 mb-2 px-4 py-2 rounded-xl bg-error-container text-on-error-container text-sm font-sans text-center">
          {error}
        </div>
      )}
      <div className="flex-shrink-0 px-6 pb-6 pt-2">
        <div className="max-w-2xl mx-auto">
          <ChatInput onSend={onSend} disabled={isLoading} />
        </div>
      </div>
    </div>
  )
}
