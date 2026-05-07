import { useEffect, useMemo, useRef, useState } from 'react'
import { A2UISetup } from './a2ui-engine/A2UISetup'
import { ChatInput } from './components/Chat/ChatInput'
import { MessageList } from './components/Chat/MessageList'
import { LeftSidebar } from './components/Layout/LeftSidebar'
import { RightSidebar } from './components/Layout/RightSidebar'
import { TopNav } from './components/Layout/TopNav'
import { PluginsPanel } from './components/Plugins/PluginsPanel'
import { APP_QUERY_KEYS } from './constants/app'
import { ComponentGallery } from './gallery/ComponentGallery'
import { useChat } from './hooks/useChat'
import { useChatStore } from './store/chatStore'
import { hasVisitedSession, markVisitedSession } from './utils/session'

function getIsGalleryMode(): boolean {
  return new URLSearchParams(window.location.search).get(APP_QUERY_KEYS.gallery) === '1'
}

function AppShell() {
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [pluginsOpen, setPluginsOpen] = useState(false)
  const [hasLoadedInitialConversations, setHasLoadedInitialConversations] = useState(false)
  const initialFirstVisit = useRef(!hasVisitedSession())

  const conversations = useChatStore((state) => state.conversations)
  const currentId = useChatStore((state) => state.currentId)
  const isLoading = useChatStore((state) => state.isLoading)
  const error = useChatStore((state) => state.error)
  const loadConversations = useChatStore((state) => state.loadConversations)
  const { handleSend } = useChat()

  const messages = useMemo(() => {
    const conversation = conversations.find((item) => item.id === currentId)
    return conversation?.messages ?? []
  }, [conversations, currentId])

  useEffect(() => {
    let isMounted = true

    loadConversations().finally(() => {
      if (!isMounted) return

      const hasConversations = useChatStore.getState().conversations.length > 0
      if (initialFirstVisit.current && hasConversations) {
        setLeftOpen(true)
      }

      setHasLoadedInitialConversations(true)
    })

    return () => {
      isMounted = false
    }
  }, [loadConversations])

  useEffect(() => {
    if (currentId && initialFirstVisit.current) {
      markVisitedSession()
    }
  }, [currentId])

  const isFirstVisit = !hasVisitedSession()
  const skipIntro = !isFirstVisit
  const showChrome = Boolean(currentId) || (hasLoadedInitialConversations && conversations.length > 0)

  return (
    <div
      className={`h-screen overflow-hidden bg-background text-on-surface${showChrome ? ' chat-active' : ''}${skipIntro ? ' skip-intro' : ''}`}
    >
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <svg className="absolute top-0 right-0 w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,200 C150,150 300,450 600,350 S850,50 1100,100" fill="none" stroke="#e9c176" strokeWidth="0.3" />
          <path d="M-50,800 C200,750 400,950 700,800 S950,550 1150,600" fill="none" stroke="#775a19" strokeWidth="0.2" />
          <path d="M200,-50 C250,200 50,400 200,700 S450,950 400,1150" fill="none" opacity="0.3" stroke="#182544" strokeWidth="0.1" />
        </svg>
      </div>

      {!currentId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pb-48 pointer-events-none welcome-overlay">
          <h3 className="font-serif text-4xl leading-relaxed text-primary">欢迎来到您的思想殿堂。</h3>
        </div>
      )}

      <div className="relative z-10 flex h-screen overflow-hidden">
        <LeftSidebar
          open={leftOpen}
          onOpen={() => setLeftOpen(true)}
          onClose={() => setLeftOpen(false)}
          onPlugins={() => {
            setLeftOpen(false)
            setPluginsOpen(true)
          }}
        />

        <main className="relative flex flex-1 flex-col h-full overflow-hidden transition-all duration-500">
          <TopNav
            onToggleLeft={() => setLeftOpen((value) => !value)}
            onToggleRight={() => setRightOpen((value) => !value)}
          />

          <section className="flex-1 px-8 pb-32 overflow-y-auto no-scrollbar md:px-16">
            <div className="w-full max-w-4xl pt-4 mx-auto space-y-16">
              {currentId && (
                <>
                  {error && (
                    <div className="px-4 py-2 text-sm text-center rounded-xl bg-error-container text-on-error-container font-sans">
                      {error}
                    </div>
                  )}
                  <MessageList messages={messages} />
                </>
              )}
            </div>
          </section>

          <footer id="footer-input-container">
            <div
              className="px-8 pt-6 pb-12 md:px-16"
              style={{
                background:
                  'linear-gradient(to top, transparent 0%, var(--color-background) 25%, var(--color-background) 75%, transparent 100%)',
              }}
            >
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
  return <A2UISetup>{getIsGalleryMode() ? <ComponentGallery /> : <AppShell />}</A2UISetup>
}
