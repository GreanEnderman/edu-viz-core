import type { MouseEvent } from 'react'
import { useChatStore } from '../../store/chatStore'
import type { AppState, PlanningState, LearningState } from '../../types/appFlow'

interface LeftSidebarProps {
  open: boolean
  onClose: () => void
  appState?: AppState
  planningData?: PlanningState | null
  learningData?: LearningState | null
  onBackToWelcome?: () => void
}

export function LeftSidebar({
  open,
  onClose: _onClose,
  appState = 'welcome',
  planningData,
  learningData,
  onBackToWelcome,
}: LeftSidebarProps) {
  const conversations = useChatStore((state) => state.conversations)
  const currentId = useChatStore((state) => state.currentId)
  const createConversation = useChatStore((state) => state.createConversation)
  const switchConversation = useChatStore((state) => state.switchConversation)
  const deleteConversation = useChatStore((state) => state.deleteConversation)

  const handleNew = async () => {
    if (onBackToWelcome) {
      onBackToWelcome()
    } else {
      await createConversation()
    }
  }

  const handleSwitch = async (id: string) => {
    await switchConversation(id)
  }

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation()
    if (confirm('确定要删除这个对话吗？')) {
      await deleteConversation(id)
    }
  }

  // 渲染项目卡片（规划和学习状态）
  const renderProjectCard = () => {
    const data = planningData || learningData
    if (!data) return null

    return (
      <div className="bg-white/50 p-6 rounded-[16px] border border-white/20 animate-fade-in">
        <label className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-2 block">
          项目目标
        </label>
        <h3 className="font-serif text-xl font-bold text-primary mb-2">{data.projectTitle}</h3>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
          {data.projectDescription}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 进度条（仅学习状态） */}
        {learningData && (
          <div className="space-y-3">
            {learningData.domainProgress.map((domain) => (
              <div key={domain.domain} className="space-y-1">
                <div className="flex justify-between text-[10px] text-on-surface-variant">
                  <span>{domain.domain}</span>
                  <span>{domain.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-outline-variant/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${domain.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 渲染知识树（学习状态）
  const renderKnowledgeTree = () => {
    if (!learningData) return null

    const renderTreeNode = (node: any, level = 0) => {
      // 状态指示器
      const renderStatusIndicator = () => {
        if (node.status === 'completed') {
          return (
            <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[10px]">check</span>
            </div>
          )
        } else if (node.status === 'in_progress') {
          return (
            <div className="relative w-3 h-3 flex items-center justify-center">
              <div className="w-full h-full rounded-full border border-primary/40 animate-ping absolute"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary relative z-10"></div>
            </div>
          )
        } else {
          return <div className="w-2 h-2 rounded-full border border-outline-variant"></div>
        }
      }

      return (
        <div key={node.id} className={`${level > 0 ? 'ml-4' : ''}`}>
          <div
            className={`p-3 rounded-lg border transition-all ${
              node.status === 'in_progress'
                ? 'bg-white shadow-sm border-white/80'
                : 'bg-white/30 border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              {renderStatusIndicator()}
              <span
                className={`text-xs font-bold ${
                  node.status === 'in_progress' ? 'text-primary' : 'text-outline-variant'
                }`}
              >
                {node.label}
              </span>
            </div>
          </div>
          {node.children && node.isExpanded && (
            <div className="mt-2 space-y-2 pl-4 border-l border-outline-variant/10">
              {node.children.map((child: any) => renderTreeNode(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col pt-4">
        <h4 className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-4">
          知识树
        </h4>
        <div className="space-y-2">
          {learningData.knowledgeTree.map((node) => renderTreeNode(node))}
        </div>
      </div>
    )
  }

  // 欢迎状态且未打开时，或规划状态且无数据时，显示占位符
  if ((appState === 'welcome' && !open) || (appState === 'planning' && !planningData)) {
    return (
      <aside className="w-[300px] flex-shrink-0 bg-surface-container-low/40 opacity-40 grayscale-[0.5] flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar border-r border-outline-variant/10">
        {/* 标题区域占位 */}
        <div className="space-y-2">
          <div className="h-6 w-32 bg-outline-variant/20 rounded"></div>
          <div className="h-3 w-24 bg-outline-variant/15 rounded"></div>
        </div>

        {/* 项目卡片占位 */}
        <div className="bg-white/50 p-6 rounded-[16px] border border-white/20 space-y-3">
          <div className="h-3 w-16 bg-outline-variant/20 rounded"></div>
          <div className="h-5 w-full bg-outline-variant/25 rounded"></div>
          <div className="h-4 w-4/5 bg-outline-variant/15 rounded"></div>
          <div className="h-4 w-3/4 bg-outline-variant/15 rounded"></div>
        </div>

        {/* 知识树导航占位 */}
        <div className="flex-1 flex flex-col space-y-3">
          <div className="bg-white/30 p-4 rounded-lg border border-white/20">
            <div className="h-4 w-20 bg-outline-variant/20 rounded"></div>
          </div>
          <div className="ml-5 space-y-2">
            <div className="h-3 w-28 bg-outline-variant/15 rounded"></div>
            <div className="h-3 w-24 bg-outline-variant/15 rounded"></div>
          </div>
        </div>

        {/* 按钮占位 */}
        <div className="h-12 bg-white/50 rounded-full border border-outline-variant/10"></div>

        {/* 历史会话占位 */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-outline-variant/20 rounded"></div>
          <div className="bg-white/30 p-3 rounded-lg border border-white/20">
            <div className="h-4 w-full bg-outline-variant/15 rounded"></div>
          </div>
          <div className="bg-white/30 p-3 rounded-lg border border-white/20">
            <div className="h-4 w-3/4 bg-outline-variant/15 rounded"></div>
          </div>
        </div>

        {/* 插件管理按钮占位 */}
        <div className="h-10 bg-white/30 rounded-full border border-outline-variant/10"></div>
      </aside>
    )
  }

  return (
    <aside
      className={`w-[300px] flex-shrink-0 bg-surface-container-low flex flex-col p-6 space-y-6 overflow-y-auto no-scrollbar border-r border-outline-variant/10 transition-all duration-300 ${
        open ? 'opacity-100' : appState === 'welcome' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'
      }`}
    >
      {/* 标题 */}
      <div className="min-w-[15rem]">
        <h1 className="font-serif text-xl font-bold text-primary">
          {appState === 'welcome' ? '藏书阁' : '学习路径'}
        </h1>
        <p className="mt-1 text-xs font-medium tracking-[0.3em] uppercase opacity-50 font-sans">
          {appState === 'welcome' ? '思想之源' : '知识导航'}
        </p>
      </div>

      {/* 项目卡片（规划和学习状态） */}
      {(appState === 'planning' || appState === 'learning' || appState === 'reflection') &&
        renderProjectCard()}

      {/* 知识树（学习状态） */}
      {(appState === 'learning' || appState === 'reflection') && renderKnowledgeTree()}

      {/* 欢迎状态：显示默认内容 */}
      {appState === 'welcome' && (
        <>
          {/* 项目卡片 */}
          <div className="bg-white/50 p-6 rounded-[24px] border border-white/20">
            <label className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-2 block">
              上个项目
            </label>
            <h3 className="font-serif text-xl font-bold text-primary/60 mb-2">
              弹簧振子模拟器
            </h3>
            <p className="text-xs text-on-surface-variant/60 leading-relaxed">
              完成一个可调节参数的交互模拟网页。
            </p>
          </div>

          {/* 知识树导航 */}
          <div className="flex-1 flex flex-col pt-4">
            <h4 className="text-[10px] uppercase tracking-widest text-outline-variant font-bold mb-4">
              知识树
            </h4>
            <div className="space-y-2 mb-6">
              <div className="bg-white/30 p-3 rounded-lg border border-white/20">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-outline-variant/40"></span>
                  <span className="text-xs font-bold text-outline-variant">物理基础</span>
                </div>
              </div>
              <div className="ml-5 pl-4 border-l border-outline-variant/10 space-y-2">
                <div className="text-xs text-on-surface-variant/40">位移速度关系</div>
                <div className="text-xs text-on-surface-variant/40">能量守恒</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 新建对话按钮 */}
      <button
        onClick={handleNew}
        className="flex items-center justify-center gap-2 rounded-full border border-outline-variant/10 py-4 shadow-sm transition-colors bg-white/50 hover:bg-white/80"
      >
        <span className="material-symbols-outlined text-secondary">add</span>
        <span className="text-sm font-bold text-secondary">
          {appState === 'welcome' ? '开启新对话' : '返回首页'}
        </span>
      </button>

      {/* 对话列表（欢迎状态） */}
      {appState === 'welcome' && conversations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-widest text-outline-variant font-bold">
            历史对话
          </h4>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSwitch(conv.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                conv.id === currentId
                  ? 'bg-secondary/10 border border-secondary/30'
                  : 'bg-white/30 border border-white/20 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface truncate flex-1">
                  {conv.title}
                </span>
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  className="ml-2 text-outline-variant hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 插件管理按钮 */}
      <button className="flex items-center justify-center gap-2 rounded-full border border-outline-variant/10 py-3 shadow-sm transition-colors bg-white/30 hover:bg-white/50">
        <span className="material-symbols-outlined text-outline-variant text-sm">extension</span>
        <span className="text-xs font-bold text-outline-variant">插件管理</span>
      </button>
    </aside>
  )
}
