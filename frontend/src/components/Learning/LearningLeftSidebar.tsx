import type { LearningState, KnowledgeTreeNode } from '../../types/appFlow'

interface LearningLeftSidebarProps {
  data: LearningState
  onBackToWelcome?: () => void
  onJumpToNode?: (nodeId: string) => void
}

interface TreeNodeProps {
  node: KnowledgeTreeNode
  currentNodeId: string
  level: number
  onNodeClick: (nodeId: string) => void
}

function TreeNode({ node, currentNodeId, level, onNodeClick }: TreeNodeProps) {
  const isCurrentNode = node.id === currentNodeId
  const hasChildren = node.children && node.children.length > 0

  // 第一层节点样式
  if (level === 0) {
    return (
      <div key={node.id}>
        <div
          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
            isCurrentNode
              ? 'bg-white border-white/80 shadow-sm'
              : 'bg-white/60 border-white/50 hover:bg-white/80'
          }`}
          onClick={() => onNodeClick(node.id)}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${
                isCurrentNode || node.status === 'completed' || node.status === 'in_progress'
                  ? 'bg-primary'
                  : 'bg-outline-variant/40'
              }`}
            />
            <span className="text-xs font-bold text-primary">{node.label}</span>
          </div>
        </div>

        {hasChildren && node.isExpanded && (
          <div className="ml-5 pl-4 border-l border-outline-variant/20 space-y-1 mt-1">
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                currentNodeId={currentNodeId}
                level={level + 1}
                onNodeClick={onNodeClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // 第二层及以下节点样式
  if (node.status === 'completed' && !isCurrentNode) {
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-3 py-2 px-2 hover:bg-white/40 rounded-lg transition-colors group cursor-pointer"
          onClick={() => onNodeClick(node.id)}
        >
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
            {node.label}
          </span>
        </div>
        {hasChildren && node.isExpanded && (
          <div className="ml-5 pl-4 border-l border-outline-variant/20 space-y-1 mt-1">
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                currentNodeId={currentNodeId}
                level={level + 1}
                onNodeClick={onNodeClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (isCurrentNode || node.status === 'in_progress') {
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-3 py-3 px-3 bg-white rounded-lg shadow-sm border border-white/80 relative -left-2 cursor-pointer"
          style={{
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
            transform: 'translateY(-2px)',
          }}
          onClick={() => onNodeClick(node.id)}
        >
          <div className="relative w-3 h-3 flex-shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full border border-primary/40 animate-ping absolute" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary relative z-10" />
          </div>
          <span className="text-xs font-bold text-primary">{node.label}</span>
        </div>
        {hasChildren && node.isExpanded && (
          <div className="ml-5 pl-4 border-l border-outline-variant/20 space-y-1 mt-1">
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                currentNodeId={currentNodeId}
                level={level + 1}
                onNodeClick={onNodeClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div key={node.id}>
      <div
        className="flex items-center gap-3 py-2 px-2 hover:bg-white/40 rounded-lg transition-colors opacity-60 hover:opacity-100 cursor-pointer"
        onClick={() => onNodeClick(node.id)}
      >
        <div className="w-2 h-2 rounded-full border border-outline-variant bg-transparent flex-shrink-0" />
        <span className="text-xs text-on-surface-variant">{node.label}</span>
      </div>
      {hasChildren && node.isExpanded && (
        <div className="ml-5 pl-4 border-l border-outline-variant/20 space-y-1 mt-1">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              currentNodeId={currentNodeId}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LearningLeftSidebar({
  data,
  onBackToWelcome,
  onJumpToNode,
}: LearningLeftSidebarProps) {
  const currentNodeId = data.currentChapter.id

  const handleNodeClick = (nodeId: string) => {
    onJumpToNode?.(nodeId)
  }

  return (
    <aside className="w-[300px] flex-shrink-0 bg-[#f4f4f0] flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar">
      {/* 返回首页按钮 */}
      <button
        onClick={onBackToWelcome}
        className="w-full py-2 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-lg hover:bg-surface-container-highest transition-colors"
      >
        返回首页
      </button>

      <div className="bg-white p-6 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.02)] border-none">
        <label className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-2 block">
          当前项目
        </label>
        <h3 className="font-display text-xl font-bold text-primary mb-2">{data.projectTitle}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-surface-container-low text-[10px] font-medium text-on-surface-variant rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          {data.projectDescription}
        </p>
      </div>

      <div className="flex-1 pt-4 flex flex-col">
        <div className="flex items-center gap-4 text-[10px] font-bold text-outline uppercase tracking-wider mb-4 px-1 overflow-x-auto no-scrollbar">
          <a className="text-secondary border-b-2 border-secondary pb-1 whitespace-nowrap cursor-pointer">
            全部
          </a>
          <a className="hover:text-primary transition-colors pb-1 whitespace-nowrap cursor-pointer">
            只看当前路径
          </a>
          <a className="hover:text-primary transition-colors pb-1 whitespace-nowrap cursor-pointer">
            只看未掌握
          </a>
          <a className="hover:text-primary transition-colors pb-1 whitespace-nowrap cursor-pointer">
            只看项目相关
          </a>
        </div>

        <div className="space-y-2 flex-1">
          {data.knowledgeTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              currentNodeId={currentNodeId}
              level={0}
              onNodeClick={handleNodeClick}
            />
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/10 space-y-2">
        <div className="bg-white/40 p-3 rounded-lg flex items-center justify-between hover:bg-white/60 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sm text-outline-variant group-hover:text-primary transition-colors">
              history
            </span>
            <span className="text-xs font-medium text-on-surface-variant">历史学习会话</span>
          </div>
          <span className="material-symbols-outlined text-xs text-outline-variant group-hover:text-primary transition-colors">
            chevron_right
          </span>
        </div>
        <div className="bg-white/40 p-3 rounded-lg flex items-center justify-between hover:bg-white/60 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sm text-outline-variant group-hover:text-primary transition-colors">
              extension
            </span>
            <span className="text-xs font-medium text-on-surface-variant">插件与组件库</span>
          </div>
          <span className="material-symbols-outlined text-xs text-outline-variant group-hover:text-primary transition-colors">
            chevron_right
          </span>
        </div>
      </div>
    </aside>
  )
}
