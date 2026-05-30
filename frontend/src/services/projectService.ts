import { requestJson, requestVoid } from './http'
import type { PblProjectGoal, PblLearningNode, PblWorkflowState } from '../types/pbl'

export interface ProjectListItem {
  id: string
  conversation_id: string
  title: string
  domains: string[]
  artifact_type: string
  difficulty: string
  created_at: string
  updated_at: string
}

export interface ProjectDetail {
  goal: PblProjectGoal
  nodes: PblLearningNode[]
  workflow_state: PblWorkflowState
  message_stats: {
    [node_id: string]: {
      count: number
      last_message_at: string
    }
  }
}

export function listProjects(): Promise<{ goals: ProjectListItem[] }> {
  return requestJson<{ goals: ProjectListItem[] }>('/v1/pbl/goals')
}

export function getProjectDetail(goalId: string): Promise<ProjectDetail> {
  return requestJson<ProjectDetail>(`/v1/pbl/goals/${goalId}/detail`)
}

export function deleteProject(goalId: string): Promise<void> {
  return requestVoid(`/v1/pbl/goals/${goalId}`, { method: 'DELETE' })
}
