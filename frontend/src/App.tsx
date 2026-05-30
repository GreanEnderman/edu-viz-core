import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { A2UISetup } from './a2ui-engine/A2UISetup'
import { AppShell } from './components/AppShell'
import { ProjectsPage } from './components/Projects/ProjectsPage'

export default function App() {
  return (
    <A2UISetup>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </BrowserRouter>
    </A2UISetup>
  )
}
