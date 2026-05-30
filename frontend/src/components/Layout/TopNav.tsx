import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import { PluginManager } from '../Plugins/PluginManager'
import type { AppState } from '../../types/appFlow'

interface TopNavProps {
  onToggleLeft?: () => void
  onToggleRight?: () => void
  appState?: AppState
  projectTitle?: string
  progress?: number
}

export function TopNav({ appState = 'welcome', projectTitle, progress = 0 }: TopNavProps) {
  const conversations = useChatStore((state) => state.conversations)
  const currentId = useChatStore((state) => state.currentId)
  const [showPluginManager, setShowPluginManager] = useState(false)

  const currentTitle = useMemo(() => {
    if (!currentId) return null
    const conversation = conversations.find((c) => c.id === currentId)
    return conversation?.title || '新会话'
  }, [currentId, conversations])

  const displayTitle = useMemo(() => {
    if (appState === 'planning' && projectTitle) {
      return `正在生成：${projectTitle}`
    }
    if ((appState === 'learning' || appState === 'reflection') && projectTitle) {
      return projectTitle
    }
    return currentTitle
  }, [appState, projectTitle, currentTitle])

  const showProgress = appState === 'learning' || appState === 'reflection'

  return (
    <>
      <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-background px-8 py-3 shadow-ambient backdrop-blur-md">
        <div className="flex items-center gap-12">
          <a href="/" className="font-display text-2xl font-bold text-primary transition-opacity hover:opacity-80">
            AhaTutor v2.0
          </a>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/projects"
              className="font-display text-lg font-medium italic tracking-tight text-stone-500 transition-colors hover:text-primary"
            >
              项目
            </Link>
          </nav>
        </div>

        <div
          className={`relative mx-8 max-w-md flex-1 transition-opacity duration-300 ${
            displayTitle ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="truncate text-sm font-medium text-secondary">{displayTitle}</span>
            <div className="relative h-px flex-1 bg-outline-variant/20">
              {showProgress && (
                <div
                  className="absolute left-0 top-0 h-full bg-secondary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowPluginManager(true)}
            className="material-symbols-outlined rounded-full p-2 text-primary transition-all hover:bg-white/50"
            title="插件管理"
          >
            extension
          </button>
          <button
            className="material-symbols-outlined rounded-full p-2 text-primary transition-all hover:bg-white/50"
            title="历史会话"
          >
            history_edu
          </button>
          <button
            className="material-symbols-outlined rounded-full p-2 text-primary transition-all hover:bg-white/50"
            title="通知"
          >
            notifications
          </button>
          <div className="h-10 w-10 cursor-pointer overflow-hidden rounded-full bg-surface-container transition-all hover:ring-2 hover:ring-primary/20">
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
          </div>
        </div>
      </header>

      {showPluginManager && <PluginManager onClose={() => setShowPluginManager(false)} />}
    </>
  )
}
