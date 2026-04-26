import { useState, useEffect, useMemo, useRef } from 'react'
import { LeftSidebar } from './components/Layout/LeftSidebar'
import { RightSidebar } from './components/Layout/RightSidebar'
import { TopNav } from './components/Layout/TopNav'
import { MessageList } from './components/Chat/MessageList'
import { ChatInput } from './components/Chat/ChatInput'
import { PluginsPanel } from './components/Plugins/PluginsPanel'
import { useChatStore } from './store/chatStore'
import { A2UISetup } from './a2ui-engine/A2UISetup'
import { useChat } from './hooks/useChat'
import { ComponentGallery } from './gallery/ComponentGallery'

// 首次访问标记：仅在当前浏览器会话中生效
function hasVisited(): boolean {
  return sessionStorage.getItem('aha_visited') === '1'
}

function markVisited(): void {
  sessionStorage.setItem('aha_visited', '1')
}

function AppShell() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [pluginsOpen, setPluginsOpen] = useState(false)
  const [hasLoadedInitialConversations, setHasLoadedInitialConversations] = useState(false)
  const isFirstVisit = !hasVisited()
  const hasAppliedInitialSidebarState = useRef(false)

  const conversations = useChatStore((s) => s.conversations)
  const currentId = useChatStore((s) => s.currentId)
  const isLoading = useChatStore((s) => s.isLoading)
  const error = useChatStore((s) => s.error)

  const messages = useMemo(() => {
    const conv = conversations.find((c) => c.id === currentId)
    return conv?.messages ?? []
  }, [conversations, currentId])
  const { handleSend } = useChat()
  const loadConversations = useChatStore((s) => s.loadConversations)

  useEffect(() => {
    let isMounted = true

    loadConversations().finally(() => {
      if (isMounted) {
        setHasLoadedInitialConversations(true)
      }
    })

    return () => {
      isMounted = false
    }
  }, [loadConversations])

  useEffect(() => {
    if (hasAppliedInitialSidebarState.current) return
    if (!hasLoadedInitialConversations) return

    if (isFirstVisit && conversations.length > 0) {
      setLeftOpen(true)
    }

    hasAppliedInitialSidebarState.current = true
  }, [conversations.length, hasLoadedInitialConversations, isFirstVisit])

  // 首次发送消息后标记已访问
  useEffect(() => {
    if (currentId && isFirstVisit) {
      markVisited()
    }
  }, [currentId, isFirstVisit])

  // 非首次访问时直接跳过动画，元素已在最终位置
  const skipIntro = !isFirstVisit
  const showChrome = Boolean(currentId) || (hasLoadedInitialConversations && conversations.length > 0)

  return (
    <div className={`h-screen overflow-hidden bg-background text-on-surface${showChrome ? ' chat-active' : ''}${skipIntro ? ' skip-intro' : ''}`}>
      {/* Background SVG decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20">
        <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,200 C150,150 300,450 600,350 S850,50 1100,100" fill="none" stroke="#e9c176" strokeWidth="0.3" />
          <path d="M-50,800 C200,750 400,950 700,800 S950,550 1150,600" fill="none" stroke="#775a19" strokeWidth="0.2" />
          <path d="M200,-50 C250,200 50,400 200,700 S450,950 400,1150" fill="none" opacity="0.3" stroke="#182544" strokeWidth="0.1" />
        </svg>
      </div>

      {/* Welcome overlay title (fades out on chat-active) - 无对话时显示 */}
      {!currentId && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 pb-48 welcome-overlay">
          <h3 className="font-serif text-4xl text-primary leading-relaxed">欢迎来到您的思想殿堂。</h3>
        </div>
      )}

      {/* Main layout */}
      <div className="flex h-screen overflow-hidden relative z-10">
        <LeftSidebar
          open={leftOpen}
          onOpen={() => setLeftOpen(true)}
          onClose={() => setLeftOpen(false)}
          onPlugins={() => {
            setLeftOpen(false)
            setPluginsOpen(true)
          }}
        />

        <main className="flex-1 flex flex-col h-full relative transition-all duration-500 overflow-hidden">
          <TopNav
            onToggleLeft={() => setLeftOpen((v) => !v)}
            onToggleRight={() => setRightOpen((v) => !v)}
          />

          {/* Scroll area */}
          <section className="flex-1 overflow-y-auto no-scrollbar px-8 md:px-16 pb-32">
            <div className="max-w-4xl mx-auto w-full space-y-16 pt-4">
              {!currentId ? null : (
                <>
                  {error && (
                    <div className="px-4 py-2 rounded-xl bg-error-container text-on-error-container text-sm font-sans text-center">
                      {error}
                    </div>
                  )}
                  <MessageList messages={messages} />
                </>
              )}
            </div>
          </section>

          {/* Footer input - absolutely positioned, animates from center to bottom */}
          <footer id="footer-input-container">
            <div className="px-8 md:px-16 pb-12 pt-6" style={{ background: 'linear-gradient(to top, transparent 0%, var(--color-background) 25%, var(--color-background) 75%, transparent 100%)' }}>
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </footer>
        </main>

        <RightSidebar open={rightOpen} onClose={() => setRightOpen(false)} />
        <PluginsPanel open={pluginsOpen} onClose={() => setPluginsOpen(false)} />
      </div>
    </div>
  )
}

export default function App() {
  // 检测 URL 参数决定显示预览库还是主界面
  const [isGallery, setIsGallery] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const galleryParam = params.get('gallery')
    setIsGallery(galleryParam === '1')
  }, [])

  return (
    <A2UISetup>
      {isGallery ? <ComponentGallery /> : <AppShell />}
    </A2UISetup>
  )
}
