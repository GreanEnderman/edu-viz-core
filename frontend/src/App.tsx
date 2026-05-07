import { A2UISetup } from './a2ui-engine/A2UISetup'
import { TopNav } from './components/Layout/TopNav'
import { LeftSidebarPlaceholder } from './components/Layout/LeftSidebarPlaceholder'
import { RightSidebarPlaceholder } from './components/Layout/RightSidebarPlaceholder'
import { WelcomeScreen } from './components/Welcome/WelcomeScreen'
import { BottomInput } from './components/Welcome/BottomInput'
import { useChatStore } from './store/chatStore'
import { useChat } from './hooks/useChat'

function AppShell() {
  const currentId = useChatStore((state) => state.currentId)
  const { handleSend } = useChat()

  const handleSelectProject = (projectPrompt: string) => {
    console.log('Selected project:', projectPrompt)
    handleSend(projectPrompt)
  }

  const handleSendMessage = (message: string) => {
    console.log('Send message:', message)
    handleSend(message)
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-on-surface">
      {/* 顶部导航栏 */}
      <TopNav />

      {/* 主内容区域：三栏布局 */}
      <div className="flex h-[calc(100vh-72px)] overflow-hidden bg-[#fffdf9] shadow-sm rounded-[24px] rounded-tr-none">
        {/* 左侧边栏占位 */}
        <LeftSidebarPlaceholder />

        {/* 中央内容区域 */}
        <main className="flex-1 bg-surface-container-lowest overflow-y-auto relative no-scrollbar flex flex-col">
          {/* 欢迎屏 */}
          <WelcomeScreen onSelectProject={handleSelectProject} />

          {/* 底部输入框 */}
          <BottomInput onSend={handleSendMessage} />
        </main>

        {/* 右侧边栏占位 */}
        <RightSidebarPlaceholder />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <A2UISetup>
      <AppShell />
    </A2UISetup>
  )
}
