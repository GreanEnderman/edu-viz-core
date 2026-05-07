import type { ServerToClientMessage } from '@a2ui/react'
import type { PluginCapability } from '../types/plugin'
import type { ComponentExample } from './showcaseData'

export const pluginGalleryExamples: ComponentExample[] = []

export function registerPluginGalleryExample(example: ComponentExample): void {
  if (pluginGalleryExamples.some((item) => item.id === example.id)) return
  pluginGalleryExamples.push(example)
}

export function buildPluginGalleryExamples(
  pluginId: string,
  pluginName: string,
  capabilities: PluginCapability[],
): void {
  const pluginsCategory = {
    id: 'plugins' as const,
    name: '插件组件',
    description: '自定义插件组件',
  }

  for (const capability of capabilities) {
    const surfaceId = `gallery-plugin-${pluginId}-${capability.component_id}`
    const props: Record<string, unknown> = {}

    if (capability.props_schema) {
      for (const [key, schema] of Object.entries(capability.props_schema)) {
        if (
          schema &&
          typeof schema === 'object' &&
          'default' in schema
        ) {
          props[key] = schema.default
        }
      }
    }

    const messages: ServerToClientMessage[] = [
      {
        surfaceUpdate: {
          surfaceId,
          components: [
            {
              id: 'root',
              component: {
                [capability.component_id]: props,
              },
            },
          ],
        },
      },
      { beginRendering: { surfaceId, root: 'root' } },
    ]

    registerPluginGalleryExample({
      id: `plugin-${pluginId}-${capability.component_id}`,
      name: capability.name || capability.component_id,
      description: `${pluginName} - ${capability.name || capability.component_id}`,
      category: pluginsCategory,
      surfaceId,
      messages,
      pluginId,
      pluginName,
    })
  }
}
