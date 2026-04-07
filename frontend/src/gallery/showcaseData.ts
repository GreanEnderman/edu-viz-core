import type { ServerToClientMessage } from '@a2ui/react'

/**
 * 组件分类
 */
export interface ComponentCategory {
  id: 'content' | 'layout' | 'interactive' | 'plugins'
  name: string
  description: string
}

/**
 * 组件展示示例
 */
export interface ComponentExample {
  id: string                    // 唯一标识 (如 "button-primary")
  name: string                  // 组件名称
  description: string           // 组件描述
  category: ComponentCategory   // 分类
  surfaceId: string             // Gallery 中的 surfaceId
  messages: ServerToClientMessage[]  // A2UI 消息序列
  pluginId?: string             // 所属插件 ID（仅插件组件）
  pluginName?: string           // 所属插件名称（仅插件组件）
}

/**
 * 组件分类列表
 */
export const showcaseCategories: ComponentCategory[] = [
  {
    id: 'content',
    name: '内容组件',
    description: 'Text, Image, Icon, Video, AudioPlayer, Divider'
  },
  {
    id: 'layout',
    name: '布局组件',
    description: 'Row, Column, List, Card, Tabs, Modal'
  },
  {
    id: 'interactive',
    name: '交互组件',
    description: 'Button, TextField, CheckBox, Slider, DateTimeInput, MultipleChoice'
  },
  {
    id: 'plugins',
    name: '插件组件',
    description: '自定义插件组件（M3+）'
  }
]
