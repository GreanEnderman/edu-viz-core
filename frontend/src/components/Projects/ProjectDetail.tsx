import { ProjectHeader } from './ProjectHeader'
import { KnowledgeTreeView } from './KnowledgeTreeView'
import { NodeMessageStats } from './NodeMessageStats'
import type { ProjectDetail as ProjectDetailType } from '../../services/projectService'

interface ProjectDetailProps {
  detail: ProjectDetailType | null
  loading: boolean
  deleting?: boolean
  onDelete?: () => void
  onNavigateToNode: (conversationId: string, nodeId: string) => void
  onSelectNode?: (nodeId: string) => void
}

export function ProjectDetail({
  detail,
  loading,
  deleting = false,
  onDelete,
  onNavigateToNode,
  onSelectNode,
}: ProjectDetailProps) {
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-12">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-5xl p-12">
        <div className="py-20 text-center">
          <p className="text-on-surface-variant">选择一个项目查看详情</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-12">
      <ProjectHeader
        goal={detail.goal}
        workflowState={detail.workflow_state}
        nodes={detail.nodes}
        deleting={deleting}
        onDelete={onDelete}
      />

      <div className="mt-8 space-y-8">
        <KnowledgeTreeView
          nodes={detail.nodes}
          messageStats={detail.message_stats}
          currentNodeId={detail.workflow_state.current_node_id}
          onSelectNode={onSelectNode}
        />

        <NodeMessageStats
          nodes={detail.nodes}
          messageStats={detail.message_stats}
          conversationId={detail.goal.conversation_id}
          onNavigateToNode={onNavigateToNode}
        />
      </div>
    </div>
  )
}
