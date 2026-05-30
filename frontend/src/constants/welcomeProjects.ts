export interface WelcomeProject {
  id: string
  icon: string
  title: string
  tags: string[]
  description: string
}

export const welcomeProjects: WelcomeProject[] = [
  {
    id: 'spring-oscillator',
    icon: 'animation',
    title: '弹簧振子模拟器',
    tags: ['物理可视化', 'JS基础'],
    description: '完成一个可调节参数的交互模拟网页，理解简谐运动的本质。',
  },
  {
    id: 'mini-transformer',
    icon: 'psychology',
    title: '迷你 Transformer',
    tags: ['人工智能', '线性代数'],
    description: '从零实现一个小型语言模型，掌握注意力机制的核心原理。',
  },
  {
    id: 'finance-analyzer',
    icon: 'account_balance_wallet',
    title: '个人财务分析工具',
    tags: ['数据处理', '前端架构'],
    description: '构建一个自动化的财务报表生成器，学习数据处理和图表绘制。',
  },
  {
    id: 'molecule-viewer',
    icon: 'science',
    title: '分子结构可视化',
    tags: ['化学', '3D', 'WebGL'],
    description: '创建一个交互式分子查看器，探索化学键和空间结构。',
  },
  {
    id: 'weather-forecast',
    icon: 'cloud',
    title: '天气预报应用',
    tags: ['API', 'React', '地图'],
    description: '开发一个实时天气应用，学习 API 集成和地理数据处理。',
  },
  {
    id: 'markdown-editor',
    icon: 'edit_note',
    title: '实时 Markdown 编辑器',
    tags: ['前端', 'TypeScript', '编辑器'],
    description: '构建一个支持实时预览的编辑器，理解文本解析和渲染。',
  },
]
