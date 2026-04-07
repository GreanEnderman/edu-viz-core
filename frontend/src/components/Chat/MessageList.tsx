import { useEffect, useRef } from 'react'
import { type Message } from '../../store/chatStore'
import { TextBubble } from './TextBubble'
import { A2UISurface } from './A2UISurface'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="space-y-0">
      {messages.map((msg) =>
        msg.type === 'a2ui' ? (
          <A2UISurface key={msg.id} surfaceId={msg.surfaceId} />
        ) : (
          <TextBubble
            key={msg.id}
            content={msg.content}
            isStreaming={msg.isStreaming}
            role={msg.role}
          />
        )
      )}
      <div ref={bottomRef} />
    </div>
  )
}
