/**
 * 应用状态流转类型定义
 * 支持四个主要状态：欢迎、规划、学习、回溯
 */

// 应用状态类型
export type AppState = 'welcome' | 'planning' | 'learning' | 'reflection'

// 知识图谱节点
export interface KnowledgeNode {
  id: string
  label: string
  icon?: string
  position: { x: number; y: number }
  connections: string[] // 连接的节点 ID
  status?: 'completed' | 'in_progress' | 'pending'
}

// 系统进程
export interface SystemProcess {
  id: string
  label: string
  status: 'completed' | 'in_progress' | 'pending'
  description?: string
}

// 策划建议
export interface Suggestion {
  id: string
  title: string
  content: string
  icon?: string
}

// 上下文记忆
export interface ContextualMemory {
  id: string
  content: string
  source?: string
}

// 规划状态数据
export interface PlanningState {
  projectId: string
  projectTitle: string
  projectDescription: string
  tags: string[]
  knowledgeGraph: KnowledgeNode[]
  systemProcesses: SystemProcess[]
  suggestions: Suggestion[]
  contextualMemory: ContextualMemory[]
  progress: number // 0-100
}

// 知识树节点
export interface KnowledgeTreeNode {
  id: string
  label: string
  status: 'completed' | 'in_progress' | 'pending'
  children?: KnowledgeTreeNode[]
  isExpanded?: boolean
}

// 章节路径
export interface ChapterPath {
  domain: string // 领域（如：物理基础）
  category: string // 分类（如：解题思维）
  topic: string // 主题（如：简谐运动）
  chapter: string // 章节（如：位移速度关系）
}

// 前置知识检查选项
export type PrerequisiteLevel = 'master' | 'familiar' | 'uncertain' | 'unfamiliar'

// 章节内容
export interface Chapter {
  id: string
  title: string
  path: ChapterPath
  content: string // Markdown 格式
  prerequisiteCheck?: {
    question: string
    options: Array<{
      level: PrerequisiteLevel
      label: string
    }>
  }
  unlockMessage?: string
}

// 项目进度步骤
export interface AdvancementStep {
  id: string
  label: string
  status: 'completed' | 'in_progress' | 'pending'
  description?: string
}

// 当前产物
export interface Artifact {
  id: string
  type: 'code' | 'diagram' | 'note'
  title: string
  content: string
  language?: string // 代码语言
}

// 反思问题
export interface ReflectionQuestion {
  id: string
  question: string
  answer: string // 参考答案
  followUp?: string
}

// 学习状态数据
export interface LearningState {
  projectId: string
  projectTitle: string
  projectDescription: string
  tags: string[]
  domainProgress: Array<{
    domain: string
    progress: number // 0-100
  }>
  currentChapter: Chapter
  knowledgeTree: KnowledgeTreeNode[]
  projectAdvancement: AdvancementStep[]
  currentArtifact: Artifact | null
  reflectionQuestions: ReflectionQuestion[]
  helpText?: string // "它将如何帮助你的项目"
}

// 回溯提示
export interface ReflectionPrompt {
  id: string
  completedConcept: string
  parentConcept: string
  message: string
}

export interface Chapter {
  showPrerequisiteCheck?: boolean
}
