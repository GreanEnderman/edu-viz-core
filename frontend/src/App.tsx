import { A2UISetup } from './a2ui-engine/A2UISetup'
import { WelcomeScreen } from './components/Welcome/WelcomeScreen'

function AppShell() {
  const handleSelectProject = (projectPrompt: string) => {
    console.log('Selected project:', projectPrompt)
    // TODO: 创建新对话并发送消息
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-on-surface">
      {/* 背景装饰 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <svg
          className="absolute top-0 right-0 w-full h-full"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100,200 C150,150 300,450 600,350 S850,50 1100,100"
            fill="none"
            stroke="#e9c176"
            strokeWidth="0.3"
          />
          <path
            d="M-50,800 C200,750 400,950 700,800 S950,550 1150,600"
            fill="none"
            stroke="#775a19"
            strokeWidth="0.2"
          />
          <path
            d="M200,-50 C250,200 50,400 200,700 S450,950 400,1150"
            fill="none"
            opacity="0.3"
            stroke="#182544"
            strokeWidth="0.1"
          />
        </svg>
      </div>

      {/* 主内容区域 */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        <main className="relative flex flex-1 flex-col h-full overflow-hidden">
          <WelcomeScreen onSelectProject={handleSelectProject} />
        </main>
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
