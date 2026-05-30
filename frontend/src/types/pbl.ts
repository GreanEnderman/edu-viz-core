export type PblNodeStatus = 'unknown' | 'skipped' | 'review' | 'learning' | 'mastered'
export type PblWorkflowMode = 'planning' | 'assessment' | 'learning' | 'review' | 'building'
export type PblNodeAction = 'mastered' | 'review' | 'assess' | 'learn' | 'complete' | 'skip'

export interface PblProjectGoal {
  id: string
  conversation_id: string
  raw_input: string
  title: string
  domains: string[]
  artifact_type: string
  difficulty: string
  constraints: Record<string, unknown>
}

export interface PblLearningNode {
  id: string
  goal_id: string
  parent_id: string | null
  title: string
  description: string
  children: string[]
  prerequisites: string[]
  mastery_criteria: string[]
  estimated_difficulty: 'easy' | 'medium' | 'hard'
  status: PblNodeStatus
  component_hints: string[]
  project_relevance: string
}

export interface PblWorkflowState {
  conversation_id: string
  goal: PblProjectGoal
  knowledge_tree: PblLearningNode[]
  current_node_id: string | null
  current_mode: PblWorkflowMode
  mastered_node_ids: string[]
  weak_node_ids: string[]
  skipped_node_ids: string[]
  project_milestones: Array<{
    node_id: string
    title: string
    status: PblNodeStatus
  }>
}

export interface CreateGoalRequest {
  raw_input: string
  conversation_id?: string
}

export interface GoalCreatedResponse {
  goal: PblProjectGoal
  workflow_state: PblWorkflowState
}

export interface TreeResponse {
  goal_id: string
  nodes: PblLearningNode[]
}

export interface NodeActionResponse {
  workflow_state: PblWorkflowState
  integration_feedback?: {
    summary: string
    project_application: string
    next_steps: string[]
    progress: number
    completed_node_title: string
    next_node_title?: string
  }
}

export interface AssessmentQuestion {
  id: string
  type?: 'multiple_choice' | 'short_answer'
  question: string
  options: string[]
  reference_answer?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  correct_answer_index?: number
  explanation?: string
}

export interface Assessment {
  id: string
  node_id: string
  goal_id: string
  questions: AssessmentQuestion[]
  created_at: string
}

export interface AssessmentResponse {
  assessment: Assessment
}

export interface SubmitAssessmentRequest {
  conversation_id: string
  user_answers: string[]
}

export interface AssessmentAttempt {
  id: string
  assessment_id: string
  conversation_id: string
  node_id: string
  user_answers: string[]
  status: 'mastered' | 'review' | 'learning'
  score: number
  reasoning: string
  weak_points: string[]
  suggestions: string[]
  created_at: string
}

export interface JudgmentResponse {
  attempt: AssessmentAttempt
  workflow_state: PblWorkflowState
}
