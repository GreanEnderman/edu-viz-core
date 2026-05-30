import type { PblLearningNode } from '../../types/pbl'

interface NodeMessageStatsProps {
  nodes: PblLearningNode[]
  messageStats: { [node_id: string]: { count: number; last_message_at: string } }
  conversationId: string
  onNavigateToNode: (conversationId: string, nodeId: string) => void
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return date.toLocaleDateString('zh-CN')
}

export function NodeMessageStats({
  nodes,
  messageStats,
  conversationId,
  onNavigateToNode,
}: NodeMessageStatsProps) {
  const nodesWithMessages = nodes
    .filter((node) => messageStats[node.id] && messageStats[node.id].count > 0)
    .sort((a, b) => {
      const timeA = new Date(messageStats[a.id].last_message_at).getTime()
      const timeB = new Date(messageStats[b.id].last_message_at).getTime()
      return timeB - timeA
    })

  return (
    <div className="rounded-[20px] border border-white/20 bg-white/50 p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-outline-variant">学习记录</h2>

      {nodesWithMessages.length === 0 ? (
        <p className="py-8 text-center text-on-surface-variant">暂无学习记录</p>
      ) : (
        <div className="space-y-3">
          {nodesWithMessages.map((node) => {
            const stats = messageStats[node.id]
            return (
              <div
                key={node.id}
                className="flex items-center justify-between rounded-lg border border-white/20 bg-white/50 p-4 transition-all hover:shadow-sm"
              >
                <div className="mr-4 min-w-0 flex-1">
                  <h4 className="mb-1 truncate text-sm font-bold text-primary" title={node.title}>
                    {node.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    {stats.count} 条消息 · {formatRelativeTime(stats.last_message_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToNode(conversationId, node.id)}
                  className="flex-shrink-0 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-secondary/90"
                >
                  查看会话
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
