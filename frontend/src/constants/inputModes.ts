export type InputMode = 'start' | 'plan' | 'ask'

export interface InputModeConfig {
  id: InputMode
  label: string
  placeholder: string
}

export const inputModes: InputModeConfig[] = [
  {
    id: 'start',
    label: 'START',
    placeholder: '描述一个你想尝试的项目，或者问问我的建议...',
  },
  {
    id: 'plan',
    label: 'PLAN',
    placeholder: '告诉我你的目标，我会帮你规划学习路径...',
  },
  {
    id: 'ask',
    label: 'ASK',
    placeholder: '有什么问题想问我？',
  },
]
