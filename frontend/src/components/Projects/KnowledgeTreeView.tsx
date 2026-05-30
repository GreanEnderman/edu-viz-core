import { useState } from 'react'
import type { PblLearningNode, PblNodeStatus } from '../../types/pbl'

interface KnowledgeTreeViewProps {
  nodes: PblLearningNode[]
  messageStats: { [node_id: string]: { count: number; last_message_at: string } }
  currentNodeId: string | null
  onSelectNode?: (nodeId: string) => void
}

interface TreeNodeData extends PblLearningNode {
  childNodes: TreeNodeData[]
}

interface TreeNodeProps {
  node: TreeNodeData
  level: number
  currentNodeId: string | null
  messageStats: { [node_id: string]: { count: number; last_message_at: string } }
  onSelectNode?: (nodeId: string) => void
}

function StatusIndicator({ status }: { status: PblNodeStatus }) {
  const statusConfig: Record<PblNodeStatus, { color: string; label: string; pulse?: boolean }> = {
    mastered: { color: 'bg-secondary', label: '✓' },
    learning: { color: 'bg-primary', label: '●', pulse: true },
    review: { color: 'bg-tertiary', label: '↺' },
    skipped: { color: 'bg-outline-variant', label: '–' },
    unknown: { color: 'bg-outline-variant/30', label: '○' },
  }

  const config = statusConfig[status] ?? statusConfig.unknown

  return (
    <div
      className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] text-white ${config.color} ${
        config.pulse ? 'animate-ping-slow' : ''
      }`}
    >
      {config.label}
    </div>
  )
}

function canSelectNode(node: PblLearningNode): boolean {
  return node.parent_id === null || node.status !== 'unknown'
}

function TreeNode({ node, level, currentNodeId, messageStats, onSelectNode }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = node.childNodes.length > 0
  const isCurrent = node.id === currentNodeId
  const isSelectable = canSelectNode(node)
  const messageCount = messageStats[node.id]?.count ?? 0

  return (
    <div className={level > 0 ? 'ml-4' : ''}>
      <div
        className={`rounded-lg border p-3 transition-all ${
          isCurrent ? 'border-white/80 bg-white shadow-sm' : 'border-white/20 bg-white/30 hover:bg-white/50'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="flex-shrink-0 text-outline-variant transition-colors hover:text-primary"
                aria-label={isExpanded ? '收起节点' : '展开节点'}
              >
                <span className={`block transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}

            <StatusIndicator status={node.status} />

            <button
              type="button"
              disabled={!isSelectable || !onSelectNode}
              onClick={() => onSelectNode?.(node.id)}
              className={`min-w-0 truncate text-left text-xs font-bold transition-colors ${
                isCurrent
                  ? 'text-primary'
                  : isSelectable
                    ? 'text-on-surface hover:text-primary'
                    : 'cursor-not-allowed text-outline-variant/70'
              }`}
              title={isSelectable ? `进入 ${node.title}` : '该节点尚未解锁'}
            >
              {node.title}
            </button>
          </div>

          {messageCount > 0 && (
            <span className="ml-2 flex-shrink-0 rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary">
              {messageCount}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2 border-l border-outline-variant/10 pl-4">
          {node.childNodes.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              currentNodeId={currentNodeId}
              messageStats={messageStats}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function KnowledgeTreeView({
  nodes,
  messageStats,
  currentNodeId,
  onSelectNode,
}: KnowledgeTreeViewProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const rootNodes = nodes.filter((node) => !node.parent_id)

  const buildTree = (node: PblLearningNode): TreeNodeData => {
    const childNodes = node.children
      .map((childId) => nodeMap.get(childId))
      .filter((child): child is PblLearningNode => child !== undefined)
      .map(buildTree)

    return { ...node, childNodes }
  }

  const tree = rootNodes.map(buildTree)

  return (
    <div className="rounded-[20px] border border-white/20 bg-white/50 p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-outline-variant">知识树</h2>

      {nodes.length === 0 ? (
        <p className="py-8 text-center text-on-surface-variant">暂无知识节点</p>
      ) : (
        <div className="space-y-2">
          {tree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              currentNodeId={currentNodeId}
              messageStats={messageStats}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
