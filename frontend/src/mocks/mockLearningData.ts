/**
 * 学习状态 Mock 数据
 * 模拟具体知识点的学习内容和进度追踪
 */

import type {
  LearningState,
  KnowledgeTreeNode,
  Chapter,
  AdvancementStep,
  Artifact,
  ReflectionQuestion,
} from '../types/appFlow'

// 知识树数据
export const mockKnowledgeTree: KnowledgeTreeNode[] = [
  {
    id: 'physics',
    label: '物理基础',
    status: 'in_progress',
    isExpanded: true,
    children: [
      {
        id: 'physics-force',
        label: '恢复力的定义',
        status: 'completed',
      },
      {
        id: 'physics-motion',
        label: '位移速度关系',
        status: 'in_progress',
      },
      {
        id: 'physics-energy',
        label: '能量守恒模拟',
        status: 'pending',
      },
      {
        id: 'physics-damping',
        label: '阻尼振动初探',
        status: 'pending',
      },
      {
        id: 'physics-forced',
        label: '受迫振动',
        status: 'pending',
      },
    ],
  },
  {
    id: 'frontend',
    label: '前端基础',
    status: 'pending',
    isExpanded: false,
  },
  {
    id: 'phase',
    label: '相位差动画',
    status: 'pending',
    isExpanded: false,
  },
  {
    id: 'damping-advanced',
    label: '受损振动',
    status: 'pending',
    isExpanded: false,
  },
]

// 当前章节内容
export const mockChapter: Chapter = {
  id: 'chapter-motion',
  title: '位移、速度、加速度关系',
  path: {
    domain: '物理基础',
    category: '解题思维',
    topic: '简谐运动',
    chapter: '当前章节',
  },
  content: `
## 正在教授

通过图周运动投影的视角，洞察运动中三个物理量随时间演化的相位奥秘。

---

### 在继续之前，我们先确认你对这一部分的熟悉程度

**前置知识检查：简谐运动中的位移、速度、加速度关系**

---

### 没想一个匀速转动的圆周，当我们只看它在水平轴上的投影...

这种视角将圆周运动转化为了直观的几何函数运动转化的相位奥秘。

通过图周运动投影的视角，洞察运动中三个物理量随时间演化的相位奥秘。你可以看到位移 $S_x$ 实际上是投影点偏离中心点的距离。那么，当这个点经过中心点（平衡位置）时，它的投影速度会发生什么？

这种视角将圆周运动转化为了直观的几何函数运动。你可以看到位移 $x(t)$ 实际上是投影点偏离中心点的距离。

$$
x = A \\cos(\\omega t + \\phi)
$$

$$
v = -A\\omega \\sin(\\omega t + \\phi) = \\omega \\sqrt{A^2 - x^2}
$$

$$
a = -A\\omega^2 \\cos(\\omega t + \\phi) = -\\omega^2 x
$$

---

**已解锁为核心概念**
`,
  prerequisiteCheck: {
    question: '简谐运动中的位移、速度、加速度关系',
    options: [
      { level: 'master', label: '我会' },
      { level: 'familiar', label: '有点忘' },
      { level: 'uncertain', label: '不确定' },
      { level: 'unfamiliar', label: '不会' },
    ],
  },
  unlockMessage: '已解锁为核心概念',
}

// 项目进度步骤
export const mockProjectAdvancement: AdvancementStep[] = [
  {
    id: 'step-1',
    label: '理解核心原理',
    status: 'completed',
  },
  {
    id: 'step-2',
    label: '完成基础交互',
    status: 'in_progress',
    description: '正在进行中...',
  },
  {
    id: 'step-3',
    label: '实现动态模拟',
    status: 'pending',
  },
  {
    id: 'step-4',
    label: '形成可展示 Demo',
    status: 'pending',
  },
]

// 当前产物（代码片段）
export const mockArtifact: Artifact = {
  id: 'artifact-1',
  type: 'code',
  title: 'LOGIC SKETCH',
  language: 'javascript',
  content: `state = { x, v, t }

a = -(k/m) * x

v = v + a * dt

x = x + v * dt`,
}

// 反思问题
export const mockReflectionQuestions: ReflectionQuestion[] = [
  {
    id: 'reflection-1',
    question: '如果像差力不是线性的，位移曲线会如何变化？',
    answer: '当恢复力不是线性的（如 F ≠ -kx），系统将不再是简谐运动。位移曲线会失去正弦波的对称性，振幅可能随时间变化，周期也可能依赖于振幅大小。例如，在非线性弹簧中，大振幅时周期可能变长或变短，这种现象称为非线性振动。',
  },
  {
    id: 'reflection-2',
    question: '为什么我们使用微积分 (v = a*dt) 而不是简单？',
    answer: '因为加速度 a 本身是随时间变化的（a = -ω²x，而 x 也在变化）。如果直接用代数公式，我们需要事先知道整个运动轨迹。而使用微分方程（欧拉法或更高阶方法），我们可以从初始状态出发，逐步推进时间，每一小步只需要当前的状态信息，这样就能模拟出整个运动过程。这是数值模拟的核心思想。',
  },
]

// 生成完整的学习状态数据
export function generateMockLearningData(projectTitle: string): LearningState {
  return {
    projectId: 'project-1',
    projectTitle,
    projectDescription: '完成一个可调参数的弹簧振子模拟器，可视化位移的交互模拟器。',
    tags: ['物理', '数学', '前端', '调试优化'],
    domainProgress: [
      { domain: '物理', progress: 0 },
      { domain: '数学', progress: 0 },
      { domain: '前端', progress: 0 },
      { domain: '调试优化', progress: 0 },
    ],
    currentChapter: mockChapter,
    knowledgeTree: mockKnowledgeTree,
    projectAdvancement: mockProjectAdvancement,
    currentArtifact: mockArtifact,
    reflectionQuestions: mockReflectionQuestions,
    helpText:
      '将数学公式 $S_x(t)$ 转化为实际坐标，构建可视化的物理模拟。通过 Q 极坐标系转换为笛卡尔坐标，将数学公式 $S_x(t)$ 转化为实际坐标...',
  }
}
