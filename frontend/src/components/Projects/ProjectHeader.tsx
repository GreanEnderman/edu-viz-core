import type { PblProjectGoal, PblLearningNode, PblWorkflowState } from '../../types/pbl'

interface ProjectHeaderProps {
  goal: PblProjectGoal
  workflowState: PblWorkflowState
  nodes: PblLearningNode[]
  deleting?: boolean
  onDelete?: () => void
}

export function ProjectHeader({
  goal,
  workflowState,
  nodes,
  deleting = false,
  onDelete,
}: ProjectHeaderProps) {
  const totalNodes = nodes.length
  const masteredNodes = workflowState.mastered_node_ids.length
  const progress = totalNodes > 0 ? Math.round((masteredNodes / totalNodes) * 100) : 0

  return (
    <div className="rounded-[20px] border border-white/20 bg-white/50 p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="mb-3 font-serif text-3xl font-bold text-primary">{goal.title}</h1>

          {goal.domains.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {goal.domains.map((domain) => (
                <span
                  key={domain}
                  className="rounded-full bg-secondary/10 px-3 py-1 text-sm font-bold text-secondary"
                >
                  {domain}
                </span>
              ))}
            </div>
          )}
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-full border border-red-200 bg-white/70 px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? '删除中...' : '删除项目'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-on-surface-variant">
          <span>学习进度</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-outline-variant/10">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-on-surface-variant">
          已掌握 {masteredNodes} / {totalNodes} 个知识点
        </p>
      </div>
    </div>
  )
}
