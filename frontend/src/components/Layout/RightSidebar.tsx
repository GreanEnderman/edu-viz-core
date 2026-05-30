import type { AppState, PlanningState, LearningState } from '../../types/appFlow'
import { SystemProcessList } from '../RightSidebar/SystemProcessList'
import { ProjectAdvancement } from '../RightSidebar/ProjectAdvancement'
import { ArtifactViewer } from '../RightSidebar/ArtifactViewer'

interface RightSidebarProps {
  open: boolean
  onClose: () => void
  appState?: AppState
  planningData?: PlanningState | null
  learningData?: LearningState | null
}

export function RightSidebar({
  open,
  onClose,
  appState = 'welcome',
  planningData,
  learningData,
}: RightSidebarProps) {
  // 渲染规划状态内容
  const renderPlanningContent = () => {
    if (!planningData) return null

    return (
      <>
        {/* 系统进程 */}
        <section>
          <h4 className="text-xs font-bold text-outline-variant mb-6 tracking-[0.2em] uppercase font-display">
            SYSTEM PROCESSES
          </h4>
          <SystemProcessList processes={planningData.systemProcesses} />
        </section>

        {/* 策划建议 */}
        {planningData.suggestions.length > 0 && (
          <section>
            <div className="p-6 rounded-lg bg-surface-container-lowest shadow-sm border border-outline-variant/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-secondary text-lg">lightbulb</span>
                <h4 className="font-sans font-bold text-sm text-on-surface">
                  {planningData.suggestions[0].title}
                </h4>
              </div>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed mb-4">
                {planningData.suggestions[0].content}
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors">
                  点这里
                </button>
                <button className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs font-medium hover:bg-surface-container-high transition-colors">
                  忽略建议
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 上下文记忆 */}
        {planningData.contextualMemory.length > 0 && (
          <section>
            <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
              CONTEXTUAL MEMORY
            </h4>
            <div className="p-4 rounded-lg border border-outline-variant/10 bg-white/20">
              <div className="flex items-start gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary text-sm">history</span>
                <p className="text-[10px] text-on-surface-variant font-medium">
                  {planningData.contextualMemory[0].source}
                </p>
              </div>
              <p className="text-xs text-on-surface italic leading-relaxed">
                {planningData.contextualMemory[0].content}
              </p>
            </div>
          </section>
        )}
      </>
    )
  }

  // 渲染学习状态内容
  const renderLearningContent = () => {
    if (!learningData) return null

    return (
      <>
        {/* 项目进度 */}
        <section>
          <h4 className="text-xs font-bold text-outline-variant mb-6 tracking-[0.2em] uppercase font-display">
            PROJECT ADVANCEMENT
          </h4>
          <ProjectAdvancement steps={learningData.projectAdvancement} />
        </section>

        {/* 帮助文本 */}
        {learningData.helpText && (
          <section>
            <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
              它将如何帮助你的项目
            </h4>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              {learningData.helpText}
            </p>
          </section>
        )}

        {/* 当前产物 */}
        {learningData.currentArtifact && (
          <section>
            <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
              CURRENT ARTIFACT
            </h4>
            <ArtifactViewer artifact={learningData.currentArtifact} />
          </section>
        )}

        {/* 反思问题 */}
        {learningData.reflectionQuestions.length > 0 && (
          <section className="flex-1">
            <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
              REFLECTION 反思
            </h4>
            <div className="space-y-4">
              {learningData.reflectionQuestions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <p className="font-sans text-sm text-on-surface font-medium leading-relaxed">
                    {q.question}
                  </p>
                  <button className="w-full px-4 py-2 rounded-lg border border-outline-variant/30 text-on-surface text-xs font-medium hover:border-secondary hover:bg-secondary/5 transition-all">
                    ANSWER
                  </button>
                  {q.followUp && (
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      {q.followUp}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    )
  }
  // 欢迎状态且未打开时，或规划状态且无数据时，显示占位符
  if ((appState === 'welcome' && !open) || (appState === 'planning' && !planningData)) {
    return (
      <aside className="w-[340px] flex-shrink-0 bg-surface-container-low/40 opacity-40 grayscale-[0.5] flex flex-col p-8 space-y-10 overflow-y-auto no-scrollbar border-l border-outline-variant/10">
        {/* 标题区域占位 */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-outline-variant/20 rounded"></div>
          <div className="w-8 h-8 bg-outline-variant/15 rounded-full"></div>
        </div>

        {/* Capabilities 占位 */}
        <div className="space-y-4">
          <div className="h-3 w-28 bg-outline-variant/20 rounded"></div>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="h-2 w-full bg-outline-variant/15 rounded-full"></div>
              <div className="h-2 w-full bg-outline-variant/10 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-outline-variant/15 rounded-full"></div>
              <div className="h-2 w-3/4 bg-outline-variant/10 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full bg-outline-variant/15 rounded-full"></div>
              <div className="h-2 w-1/2 bg-outline-variant/10 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* System Status 占位 */}
        <div className="space-y-4">
          <div className="h-3 w-32 bg-outline-variant/20 rounded"></div>
          <div className="p-4 rounded-lg border border-outline-variant/10 bg-white/20">
            <div className="space-y-2">
              <div className="h-2 w-full bg-outline-variant/15 rounded"></div>
              <div className="h-2 w-4/5 bg-outline-variant/15 rounded"></div>
            </div>
          </div>
        </div>

        {/* Recent Skills 占位 */}
        <div className="space-y-4">
          <div className="h-3 w-28 bg-outline-variant/20 rounded"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-20 bg-white/30 rounded-full border border-outline-variant/20"></div>
            <div className="h-6 w-24 bg-white/30 rounded-full border border-outline-variant/20"></div>
            <div className="h-6 w-20 bg-white/30 rounded-full border border-outline-variant/20"></div>
            <div className="h-6 w-16 bg-white/30 rounded-full border border-outline-variant/20"></div>
          </div>
        </div>

        {/* 启发时刻占位 */}
        <div className="flex-1 space-y-4">
          <div className="h-3 w-24 bg-outline-variant/20 rounded"></div>
          <div className="p-4 bg-white rounded-lg border-l-2 border-outline-variant/20 shadow-sm space-y-2">
            <div className="h-3 w-full bg-outline-variant/15 rounded"></div>
            <div className="h-3 w-4/5 bg-outline-variant/15 rounded"></div>
          </div>
        </div>

        {/* 基石占位 */}
        <div className="space-y-4">
          <div className="h-3 w-16 bg-outline-variant/20 rounded"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-outline-variant/20 p-4 rounded-lg aspect-square"></div>
            <div className="bg-outline-variant/15 p-4 rounded-lg aspect-square"></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`w-[340px] flex-shrink-0 bg-surface-container-low flex flex-col p-8 space-y-10 overflow-y-auto no-scrollbar border-l border-outline-variant/10 transition-all duration-300 ${
        open ? 'opacity-100' : appState === 'welcome' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'
      }`}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-primary font-bold">
          {appState === 'planning' ? '系统规划' : appState === 'learning' || appState === 'reflection' ? '学习进度' : '综合思考'}
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      {/* 根据状态渲染不同内容 */}
      {appState === 'planning' && renderPlanningContent()}
      {(appState === 'learning' || appState === 'reflection') && renderLearningContent()}

      {/* 欢迎状态：显示默认内容 */}
      {appState === 'welcome' && (
        <>
          {/* 能力进度 */}
          <section>
            <h4 className="text-xs font-bold text-outline-variant mb-6 tracking-[0.2em] uppercase font-display">
              Capabilities
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>物理建模</span>
                  <span>75%</span>
                </div>
                <div className="h-2 w-full bg-outline-variant/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-3/4 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>动画实现</span>
                  <span>60%</span>
                </div>
                <div className="h-2 w-full bg-outline-variant/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-3/5 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>数学推导</span>
                  <span>45%</span>
                </div>
                <div className="h-2 w-full bg-outline-variant/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[45%] rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          {/* 系统状态 */}
          <section>
            <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
              System Status
            </h4>
            <div className="p-4 rounded-lg border border-outline-variant/10 bg-white/20">
              <p className="text-[10px] text-outline-variant italic leading-relaxed">
                准备就绪，待命开始新的学习旅程。
              </p>
            </div>
          </section>

          {/* 技能标签 */}
          <section>
            <h4 className="text-xs font-bold text-outline-variant mb-4 tracking-[0.2em] uppercase font-display">
              Recent Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
                物理建模
              </span>
              <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
                动画实现
              </span>
              <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
                Canvas API
              </span>
              <span className="px-3 py-1.5 bg-white/30 text-[10px] font-bold rounded-full border border-outline-variant/20 text-outline-variant">
                简谐运动
              </span>
            </div>
          </section>

          {/* 启发时刻 */}
          <section className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-sm">lightbulb</span>
              <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">
                启发时刻
              </h4>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-lg border-l-2 border-secondary shadow-sm">
                <p className="font-sans text-sm text-primary font-medium leading-relaxed italic">
                  在对话中发现的洞察将显示在此处。
                </p>
              </div>
            </div>
          </section>

          {/* 基石 */}
          <section>
            <h4 className="font-sans font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
              基石
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary text-surface p-4 rounded-lg flex flex-col justify-between aspect-square">
                <span className="material-symbols-outlined text-sm">book</span>
                <p className="font-serif text-xs leading-tight font-medium">相关知识文档</p>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-lg flex flex-col justify-between aspect-square">
                <span className="material-symbols-outlined text-primary text-sm">article</span>
                <p className="font-sans font-bold text-[8px] text-primary">学习笔记</p>
              </div>
            </div>
          </section>
        </>
      )}
    </aside>
  )
}
