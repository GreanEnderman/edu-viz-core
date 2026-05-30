import { ProjectListItem } from './ProjectListItem'
import type { ProjectListItem as ProjectListItemType } from '../../services/projectService'

interface ProjectListProps {
  projects: ProjectListItemType[]
  selectedId: string | null
  onSelect: (projectId: string) => void
}

export function ProjectList({ projects, selectedId, onSelect }: ProjectListProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-primary mb-4">
        我的项目
      </h2>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-on-surface-variant mb-4">还没有项目</p>
          <a href="/" className="text-secondary underline hover:text-secondary/80 transition-colors">
            创建第一个项目
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              isSelected={project.id === selectedId}
              onSelect={() => onSelect(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
