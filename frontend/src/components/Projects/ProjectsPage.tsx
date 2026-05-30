import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TopNav } from '../Layout/TopNav'
import { ProjectList } from './ProjectList'
import { ProjectDetail } from './ProjectDetail'
import {
  deleteProject,
  getProjectDetail,
  listProjects,
  type ProjectDetail as ProjectDetailType,
  type ProjectListItem,
} from '../../services/projectService'

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectDetail, setProjectDetail] = useState<ProjectDetailType | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      void loadProjectDetail(selectedProjectId)
      return
    }
    setProjectDetail(null)
  }, [selectedProjectId])

  const loadProjects = async () => {
    try {
      setError(null)
      const { goals } = await listProjects()
      setProjects(goals)
      setSelectedProjectId((current) => {
        if (current && goals.some((goal) => goal.id === current)) {
          return current
        }
        return goals[0]?.id ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目列表失败')
    }
  }

  const loadProjectDetail = async (goalId: string) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await getProjectDetail(goalId)
      setProjectDetail(detail)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigateToNode = (conversationId: string, nodeId: string) => {
    navigate(`/?conversation=${conversationId}&node=${nodeId}`)
  }

  const handleSelectNode = (nodeId: string) => {
    if (!projectDetail) return
    handleNavigateToNode(projectDetail.goal.conversation_id, nodeId)
  }

  const handleDeleteProject = async () => {
    if (!projectDetail) return

    const confirmed = window.confirm(`确认删除项目「${projectDetail.goal.title}」吗？相关会话和学习记录也会一起删除。`)
    if (!confirmed) return

    setDeleting(true)
    setError(null)
    try {
      const deletingId = projectDetail.goal.id
      const remainingProjects = projects.filter((project) => project.id !== deletingId)
      await deleteProject(deletingId)
      setProjects(remainingProjects)
      setSelectedProjectId(remainingProjects[0]?.id ?? null)
      setProjectDetail(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除项目失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <TopNav appState="welcome" />

      <div className="flex h-[calc(100vh-64px)]">
        <aside className="no-scrollbar w-[360px] overflow-y-auto bg-surface-container-low p-6">
          <ProjectList
            projects={projects}
            selectedId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />
        </aside>

        <main className="no-scrollbar flex-1 overflow-y-auto bg-surface">
          {error && (
            <div className="mx-auto max-w-5xl p-12">
              <div className="rounded-lg border border-error/20 bg-error/10 p-4 text-error">
                {error}
              </div>
            </div>
          )}
          <ProjectDetail
            detail={projectDetail}
            loading={loading}
            deleting={deleting}
            onDelete={handleDeleteProject}
            onNavigateToNode={handleNavigateToNode}
            onSelectNode={handleSelectNode}
          />
        </main>
      </div>
    </div>
  )
}
