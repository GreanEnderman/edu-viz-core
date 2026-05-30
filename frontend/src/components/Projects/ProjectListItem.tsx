import type { ProjectListItem as ProjectListItemType } from '../../services/projectService'

interface ProjectListItemProps {
  project: ProjectListItemType
  isSelected: boolean
  onSelect: () => void
}

const difficultyMap: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
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

export function ProjectListItem({ project, isSelected, onSelect }: ProjectListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-[16px] border transition-all text-left ${
        isSelected
          ? 'bg-secondary/10 border-secondary/30 shadow-md'
          : 'bg-white/50 border-white/20 hover:bg-white/80 hover:shadow-sm'
      }`}
    >
      {/* 标题 */}
      <h3 className="font-serif text-lg font-bold text-primary mb-2 line-clamp-2">
        {project.title}
      </h3>

      {/* 领域标签 */}
      {project.domains.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {project.domains.map((domain) => (
            <span
              key={domain}
              className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full"
            >
              {domain}
            </span>
          ))}
        </div>
      )}

      {/* 难度和时间 */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant">
        <span>难度：{difficultyMap[project.difficulty] || project.difficulty}</span>
        <span>{formatRelativeTime(project.updated_at)}</span>
      </div>
    </button>
  )
}
