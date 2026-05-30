/**
 * 规划状态 Mock 数据
 * 模拟系统分析项目需求并构建学习路径的过程
 */

import type {
  PlanningState,
  KnowledgeNode,
  SystemProcess,
  Suggestion,
  ContextualMemory,
} from '../types/appFlow'

// 知识图谱节点数据
export const mockKnowledgeGraph: KnowledgeNode[] = [
  {
    id: 'center',
    label: '物理建模',
    position: { x: 300, y: 200 },
    connections: ['node-a', 'node-b', 'node-c'],
    status: 'in_progress',
  },
  {
    id: 'node-a',
    label: 'A',
    position: { x: 150, y: 120 },
    connections: ['center', 'node-d'],
    status: 'pending',
  },
  {
    id: 'node-b',
    label: 'B',
    position: { x: 450, y: 120 },
    connections: ['center', 'node-e'],
    status: 'pending',
  },
  {
    id: 'node-c',
    label: 'C',
    position: { x: 300, y: 320 },
    connections: ['center', 'node-f'],
    status: 'pending',
  },
  {
    id: 'node-d',
    label: 'D',
    position: { x: 100, y: 280 },
    connections: ['node-a'],
    status: 'pending',
  },
  {
    id: 'node-e',
    label: 'E',
    position: { x: 500, y: 280 },
    connections: ['node-b'],
    status: 'pending',
  },
  {
    id: 'node-f',
    label: 'F',
    position: { x: 200, y: 400 },
    connections: ['node-c'],
    status: 'pending',
  },
]

// 系统进程数据（初始状态）
export const mockSystemProcessesInitial: SystemProcess[] = [
  {
    id: 'identify',
    label: '识别领域中...',
    status: 'pending',
    description: '物理模拟、UI 设计、数学',
  },
  {
    id: 'infer',
    label: '推断前置知识...',
    status: 'pending',
    description: '将胡克定律映射到 JS 函数',
  },
  {
    id: 'organize',
    label: '组织学习节点...',
    status: 'pending',
    description: '等待依赖解析',
  },
  {
    id: 'generate',
    label: '生成产物模板...',
    status: 'pending',
  },
]

// 策划建议
export const mockSuggestions: Suggestion[] = [
  {
    id: 'suggestion-1',
    title: '策划建议',
    content:
      '由于你对"位移速度关系"已有初步理解，现阶段建议跳过基础讲解，直接从"微积分分析"开始，重点关注如何将物理公式转化为代码。',
    icon: '💡',
  },
]

// 上下文记忆
export const mockContextualMemory: ContextualMemory[] = [
  {
    id: 'memory-1',
    content:
      '"recall: 曾在 21 节中使用过类似的 canvas 绘图逻辑，建议复用那部分的坐标变换代码。"',
    source: '历史关联',
  },
]

// 生成完整的规划状态数据
export function generateMockPlanningData(projectTitle: string): PlanningState {
  return {
    projectId: 'project-1',
    projectTitle,
    projectDescription: '完成一个可调参数的弹簧振子模拟器，可视化位移的交互模拟器。',
    tags: ['物理建模', 'JS基础'],
    knowledgeGraph: mockKnowledgeGraph,
    systemProcesses: mockSystemProcessesInitial,
    suggestions: mockSuggestions,
    contextualMemory: mockContextualMemory,
    progress: 0,
  }
}

// 模拟系统进程逐步完成
export function simulateSystemProcesses(
  onUpdate: (processes: SystemProcess[]) => void,
  onComplete: () => void
) {
  const processes = [...mockSystemProcessesInitial]
  let currentStep = 0

  const interval = setInterval(() => {
    if (currentStep > 0) {
      processes[currentStep - 1].status = 'completed'
    }

    if (currentStep < processes.length) {
      processes[currentStep].status = 'in_progress'
      onUpdate([...processes])
      currentStep++
    } else {
      clearInterval(interval)
      processes[processes.length - 1].status = 'completed'
      onUpdate([...processes])
      setTimeout(() => {
        onComplete()
      }, 1000)
    }
  }, 2000) // 每 2 秒完成一个步骤

  return () => clearInterval(interval)
}
