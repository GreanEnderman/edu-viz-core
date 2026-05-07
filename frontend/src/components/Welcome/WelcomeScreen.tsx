import { welcomeProjects } from '../../constants/welcomeProjects'
import { ProjectCard } from './ProjectCard'

interface WelcomeScreenProps {
  onSelectProject: (projectPrompt: string) => void
}

export function WelcomeScreen({ onSelectProject }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-12 text-center">
      {/* 欢迎文案 */}
      <div className="space-y-6 mb-12">
        <h2 className="font-display text-[42px] text-primary leading-tight font-bold">
          今天，你想完成什么？
        </h2>
        <p className="font-body text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          不是"学什么"，而是"你想做成什么"。从一个项目开始，我们会为你拆出知识路径。
        </p>
      </div>

      {/* 项目卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-16">
        {welcomeProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onSelect={onSelectProject} />
        ))}
      </div>
    </div>
  )
}
