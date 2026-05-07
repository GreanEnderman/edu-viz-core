import type { WelcomeProject } from '../../constants/welcomeProjects'

interface ProjectCardProps {
  project: WelcomeProject
  onSelect: (projectTitle: string) => void
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const handleClick = () => {
    onSelect(`我想做一个${project.title}：${project.description}`)
  }

  return (
    <button
      onClick={handleClick}
      className="bg-white p-6 rounded-[28px] border border-outline-variant/10
        shadow-sm hover:shadow-xl hover:border-secondary/20 transition-all
        flex flex-col items-start text-left group cursor-pointer w-full"
    >
      {/* 图标容器 */}
      <div
        className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center
          justify-center text-secondary mb-4 group-hover:scale-110 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">{project.icon}</span>
      </div>

      {/* 标题 */}
      <h3 className="font-serif text-xl font-bold text-primary mb-3 leading-tight">
        {project.title}
      </h3>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-surface-container-low text-[10px]
              font-medium text-on-surface-variant rounded uppercase tracking-wider"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 描述 */}
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {project.description}
      </p>
    </button>
  )
}
