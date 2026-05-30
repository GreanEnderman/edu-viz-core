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
      className="bg-white p-6 rounded-[20px] border border-outline-variant/10
        shadow-sm hover:shadow-xl hover:border-secondary/20 transition-all
        flex flex-col items-start text-left group cursor-pointer w-full"
    >
      {/* 图标容器 */}
      <div
        className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center
          justify-center text-secondary mb-4 group-hover:scale-110 transition-transform"
      >
        <span className="material-symbols-outlined text-2xl">{project.icon}</span>
      </div>

      {/* 标题 */}
      <h4 className="font-bold text-primary mb-2">{project.title}</h4>

      {/* 标签 */}
      <span className="text-[10px] text-outline-variant font-medium uppercase tracking-widest">
        {project.tags.join(' • ')}
      </span>
    </button>
  )
}
