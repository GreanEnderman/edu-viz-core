import type { ServerToClientMessage } from '@a2ui/react'
import { showcaseCategories } from './showcaseData'

// Re-export categories for convenience
export { showcaseCategories }

/**
 * A2UI 组件示例消息库
 * 每个组件都有独立的 surfaceId 和完整的消息序列
 */

// ============================================================================
// 内容组件 (Content Components)
// ============================================================================

/** Text - 标题示例 */
export const textHeadingExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-text-heading',
      components: [{
        id: 'root',
        component: {
          Text: {
            text: { literalString: '欢迎使用 AhaTutor' },
            usageHint: 'h2'
          }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-text-heading', root: 'root' } }
]

/** Text - 正文示例 */
export const textBodyExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-text-body',
      components: [{
        id: 'root',
        component: {
          Text: {
            text: { literalString: '这是一段正文文本，用于展示常规文本内容的样式。A2UI 的 Text 组件支持多种 usageHint，包括标题、副标题、正文和说明文字。' },
            usageHint: 'body'
          }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-text-body', root: 'root' } }
]

/** Icon - 图标示例 */
export const iconExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-icon',
      components: [{
        id: 'root',
        component: {
          Icon: { name: { literalString: 'check' } }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-icon', root: 'root' } }
]

/** Divider - 分隔线示例 */
export const dividerExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-divider',
      components: [{
        id: 'root',
        component: {
          Column: {
            children: {
              explicitList: ['text1', 'divider', 'text2']
            },
            alignment: 'center'
          }
        }
      }, {
        id: 'text1',
        component: {
          Text: { text: { literalString: '第一部分' } }
        }
      }, {
        id: 'divider',
        component: { Divider: {} }
      }, {
        id: 'text2',
        component: {
          Text: { text: { literalString: '第二部分' } }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-divider', root: 'root' } }
]

// ============================================================================
// 布局组件 (Layout Components)
// ============================================================================

/** Row - 水平布局示例 */
export const rowExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-row',
      components: [{
        id: 'root',
        component: {
          Row: {
            children: {
              explicitList: ['item1', 'item2', 'item3']
            },
            distribution: 'spaceBetween'
          }
        }
      }, {
        id: 'item1',
        component: {
          Text: { text: { literalString: '左侧' } }
        }
      }, {
        id: 'item2',
        component: {
          Text: { text: { literalString: '中间' } }
        }
      }, {
        id: 'item3',
        component: {
          Text: { text: { literalString: '右侧' } }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-row', root: 'root' } }
]

/** Column - 垂直布局示例 */
export const columnExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-column',
      components: [{
        id: 'root',
        component: {
          Column: {
            children: {
              explicitList: ['title', 'desc', 'btn']
            },
            alignment: 'center'
          }
        }
      }, {
        id: 'title',
        component: {
          Text: {
            text: { literalString: '卡片标题' },
            usageHint: 'h3'
          }
        }
      }, {
        id: 'desc',
        component: {
          Text: {
            text: { literalString: '这是一个垂直布局示例' },
            usageHint: 'body'
          }
        }
      }, {
        id: 'btn-text',
        component: {
          Text: { text: { literalString: '操作' } }
        }
      }, {
        id: 'btn',
        component: {
          Button: {
            child: 'btn-text',
            action: { name: 'click', context: {} }
          }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-column', root: 'root' } }
]

/** Card - 卡片容器示例 */
export const cardExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-card',
      components: [{
        id: 'root',
        component: {
          Card: { child: 'content' }
        }
      }, {
        id: 'content',
        component: {
          Column: {
            children: {
              explicitList: ['title', 'desc']
            }
          }
        }
      }, {
        id: 'title',
        component: {
          Text: {
            text: { literalString: '卡片标题' },
            usageHint: 'h4'
          }
        }
      }, {
        id: 'desc',
        component: {
          Text: {
            text: { literalString: 'Card 组件提供一个带阴影和圆角的容器。' }
          }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-card', root: 'root' } }
]

// ============================================================================
// 交互组件 (Interactive Components)
// ============================================================================

/** Button - Primary (主要按钮) */
export const buttonPrimaryExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-button-primary',
      components: [{
        id: 'btn-text',
        component: {
          Text: { text: { literalString: '主要操作' } }
        }
      }, {
        id: 'root',
        component: {
          Button: {
            child: 'btn-text',
            action: { name: 'click', context: {} },
            primary: true
          }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-button-primary', root: 'root' } }
]

/** Button - Secondary (次要按钮) */
export const buttonSecondaryExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-button-secondary',
      components: [{
        id: 'btn-text',
        component: {
          Text: { text: { literalString: '次要操作' } }
        }
      }, {
        id: 'root',
        component: {
          Button: {
            child: 'btn-text',
            action: { name: 'click', context: {} }
          }
        }
      }]
    }
  },
  { beginRendering: { surfaceId: 'gallery-button-secondary', root: 'root' } }
]

/** TextField - 文本输入框 */
export const textFieldExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-textfield',
      components: [{
        id: 'root',
        component: {
          TextField: {
            label: { literalString: '请输入用户名' },
            text: { path: '/username' }
          }
        }
      }]
    }
  },
  {
    dataModelUpdate: {
      surfaceId: 'gallery-textfield',
      contents: [
        { key: 'username', valueString: '' }
      ]
    }
  },
  { beginRendering: { surfaceId: 'gallery-textfield', root: 'root' } }
]

/** CheckBox - 复选框（未选中） */
export const checkboxUncheckedExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-checkbox-unchecked',
      components: [{
        id: 'root',
        component: {
          Checkbox: {
            label: { literalString: '记住我' },
            value: { path: '/remember' }
          }
        }
      }]
    }
  },
  {
    dataModelUpdate: {
      surfaceId: 'gallery-checkbox-unchecked',
      contents: [
        { key: 'remember', valueBoolean: false }
      ]
    }
  },
  { beginRendering: { surfaceId: 'gallery-checkbox-unchecked', root: 'root' } }
]

/** CheckBox - 复选框（已选中） */
export const checkboxCheckedExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-checkbox-checked',
      components: [{
        id: 'root',
        component: {
          Checkbox: {
            label: { literalString: '我已阅读并同意条款' },
            value: { path: '/agree' }
          }
        }
      }]
    }
  },
  {
    dataModelUpdate: {
      surfaceId: 'gallery-checkbox-checked',
      contents: [
        { key: 'agree', valueBoolean: true }
      ]
    }
  },
  { beginRendering: { surfaceId: 'gallery-checkbox-checked', root: 'root' } }
]

/** Slider - 滑块 */
export const sliderExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-slider',
      components: [{
        id: 'root',
        component: {
          Slider: {
            value: { path: '/value' },
            minValue: 0,
            maxValue: 100
          }
        }
      }]
    }
  },
  {
    dataModelUpdate: {
      surfaceId: 'gallery-slider',
      contents: [
        { key: 'value', valueNumber: 50 }
      ]
    }
  },
  { beginRendering: { surfaceId: 'gallery-slider', root: 'root' } }
]

/** MultipleChoice - Checkbox 样式 */
export const multipleChoiceSingleExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-mc-single',
      components: [{
        id: 'root',
        component: {
          MultipleChoice: {
            selections: { path: '/subjects' },
            options: [
              { label: { literalString: '物理' }, value: 'physics' },
              { label: { literalString: '数学' }, value: 'math' },
              { label: { literalString: '化学' }, value: 'chemistry' }
            ],
            type: 'checkbox'
          }
        }
      }]
    }
  },
  {
    dataModelUpdate: {
      surfaceId: 'gallery-mc-single',
      contents: [
        { key: 'subjects', valueString: '' }
      ]
    }
  },
  { beginRendering: { surfaceId: 'gallery-mc-single', root: 'root' } }
]

/** DateTimeInput - 日期选择 */
export const dateTimeInputExample: ServerToClientMessage[] = [
  {
    surfaceUpdate: {
      surfaceId: 'gallery-datetime',
      components: [{
        id: 'root',
        component: {
          DateTimeInput: {
            value: { path: '/date' },
            enableDate: true,
            enableTime: false
          }
        }
      }]
    }
  },
  {
    dataModelUpdate: {
      surfaceId: 'gallery-datetime',
      contents: [
        { key: 'date', valueString: '2026-03-31' }
      ]
    }
  },
  { beginRendering: { surfaceId: 'gallery-datetime', root: 'root' } }
]

// ============================================================================
// 导出所有示例
// ============================================================================

import type { ComponentExample } from './showcaseData'

/** 所有组件示例列表 */
export const componentExamples: ComponentExample[] = [
  // 内容组件
  {
    id: 'text-heading',
    name: 'Text (Heading)',
    description: '标题样式文本',
    category: showcaseCategories[0],
    surfaceId: 'gallery-text-heading',
    messages: textHeadingExample
  },
  {
    id: 'text-body',
    name: 'Text (Body)',
    description: '正文样式文本',
    category: showcaseCategories[0],
    surfaceId: 'gallery-text-body',
    messages: textBodyExample
  },
  {
    id: 'icon',
    name: 'Icon',
    description: 'Material Design 图标',
    category: showcaseCategories[0],
    surfaceId: 'gallery-icon',
    messages: iconExample
  },
  {
    id: 'divider',
    name: 'Divider',
    description: '分隔线组件',
    category: showcaseCategories[0],
    surfaceId: 'gallery-divider',
    messages: dividerExample
  },

  // 布局组件
  {
    id: 'row',
    name: 'Row',
    description: '水平布局容器',
    category: showcaseCategories[1],
    surfaceId: 'gallery-row',
    messages: rowExample
  },
  {
    id: 'column',
    name: 'Column',
    description: '垂直布局容器',
    category: showcaseCategories[1],
    surfaceId: 'gallery-column',
    messages: columnExample
  },
  {
    id: 'card',
    name: 'Card',
    description: '带阴影的卡片容器',
    category: showcaseCategories[1],
    surfaceId: 'gallery-card',
    messages: cardExample
  },

  // 交互组件 - 多种状态
  {
    id: 'button-primary',
    name: 'Button (Primary)',
    description: '主要操作按钮',
    category: showcaseCategories[2],
    surfaceId: 'gallery-button-primary',
    messages: buttonPrimaryExample
  },
  {
    id: 'button-secondary',
    name: 'Button (Secondary)',
    description: '次要操作按钮',
    category: showcaseCategories[2],
    surfaceId: 'gallery-button-secondary',
    messages: buttonSecondaryExample
  },
  {
    id: 'textfield',
    name: 'TextField',
    description: '文本输入框',
    category: showcaseCategories[2],
    surfaceId: 'gallery-textfield',
    messages: textFieldExample
  },
  {
    id: 'checkbox-unchecked',
    name: 'CheckBox (Unchecked)',
    description: '未选中的复选框',
    category: showcaseCategories[2],
    surfaceId: 'gallery-checkbox-unchecked',
    messages: checkboxUncheckedExample
  },
  {
    id: 'checkbox-checked',
    name: 'CheckBox (Checked)',
    description: '已选中的复选框',
    category: showcaseCategories[2],
    surfaceId: 'gallery-checkbox-checked',
    messages: checkboxCheckedExample
  },
  {
    id: 'slider',
    name: 'Slider',
    description: '数值范围滑块',
    category: showcaseCategories[2],
    surfaceId: 'gallery-slider',
    messages: sliderExample
  },
  {
    id: 'multiple-choice',
    name: 'MultipleChoice',
    description: '单选/多选组件',
    category: showcaseCategories[2],
    surfaceId: 'gallery-mc-single',
    messages: multipleChoiceSingleExample
  },
  {
    id: 'datetime-input',
    name: 'DateTimeInput',
    description: '日期时间选择器',
    category: showcaseCategories[2],
    surfaceId: 'gallery-datetime',
    messages: dateTimeInputExample
  }
]
