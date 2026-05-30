import type { ChatMessagePayload } from '../types/chat'
import type {
  CreateGoalRequest,
  GoalCreatedResponse,
  NodeActionResponse,
  PblNodeAction,
  PblWorkflowState,
  TreeResponse,
  AssessmentResponse,
  JudgmentResponse,
} from '../types/pbl'
import { API_BASE, requestJson } from './http'
import { streamChat, type StreamOptions } from './chatService'

export function createPblGoal(payload: CreateGoalRequest): Promise<GoalCreatedResponse> {
  return requestJson<GoalCreatedResponse>('/v1/pbl/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function generatePblTree(goalId: string): Promise<TreeResponse> {
  return requestJson<TreeResponse>(`/v1/pbl/goals/${goalId}/tree`, {
    method: 'POST',
  })
}

export function getPblState(conversationId: string): Promise<PblWorkflowState> {
  return requestJson<PblWorkflowState>(`/v1/pbl/sessions/${conversationId}/state`)
}

export function applyPblNodeAction(
  nodeId: string,
  conversationId: string,
  action: PblNodeAction,
): Promise<NodeActionResponse> {
  return requestJson<NodeActionResponse>(`/v1/pbl/nodes/${nodeId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      action,
    }),
  })
}

export function switchToNode(
  nodeId: string,
  conversationId: string,
): Promise<PblWorkflowState> {
  return requestJson<PblWorkflowState>(`/v1/pbl/sessions/${conversationId}/switch-node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      node_id: nodeId,
    }),
  })
}

export function generateAssessment(
  nodeId: string,
  conversationId: string,
): Promise<AssessmentResponse> {
  return requestJson<AssessmentResponse>(`/v1/pbl/nodes/${nodeId}/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
    }),
  })
}

export function submitAssessment(
  assessmentId: string,
  conversationId: string,
  userAnswers: string[],
): Promise<JudgmentResponse> {
  return requestJson<JudgmentResponse>(`/v1/pbl/assessments/${assessmentId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      user_answers: userAnswers,
    }),
  })
}

export function streamPblChat(
  conversationId: string,
  messages: ChatMessagePayload[],
  callbacks: Parameters<typeof streamChat>[1],
  options?: Omit<StreamOptions, 'conversationId'>,
): Promise<void> {
  return streamChat(messages, callbacks, {
    ...options,
    conversationId,
    endpoint: `${API_BASE}/v1/pbl/chat`,
  })
}

/**
 * 生成反思问题的答案
 */
export async function generateReflectionAnswer(
  conversationId: string,
  question: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let answer = ''

    const messages: ChatMessagePayload[] = [
      {
        role: 'user',
        content: `请为以下反思问题提供一个简洁、清晰的参考答案（2-3句话）：\n\n${question}`,
      },
    ]

    streamPblChat(
      conversationId,
      messages,
      {
        onChunk: (chunk: string) => {
          answer += chunk
        },
        onA2UILine: () => {
          // 忽略 A2UI 消息
        },
        onTitle: () => {
          // 忽略标题
        },
        onError: (error: Error) => {
          reject(error)
        },
        onDone: () => {
          resolve(answer.trim())
        },
      },
    ).catch(reject)
  })
}
