import type { ServerToClientMessage } from '@a2ui/react'
import type { ComponentExample } from './showcaseData'

/** Gallery examples registered by plugins */
export const pluginGalleryExamples: ComponentExample[] = []

/**
 * Register a plugin component's gallery preview.
 * Called by CatalogRegistry after loading plugin capabilities.
 */
export function registerPluginGalleryExample(example: ComponentExample): void {
  // Avoid duplicates
  if (pluginGalleryExamples.some(e => e.id === example.id)) return
  pluginGalleryExamples.push(example)
}

/**
 * Build gallery examples from a plugin's capability data.
 * Called during plugin loading in CatalogRegistry.
 */
export function buildPluginGalleryExamples(
  pluginId: string,
  pluginName: string,
  capabilities: Array<{
    component_id: string
    name: string
    props_schema?: Record<string, any>
  }>,
): void {
  const pluginsCategory = { id: 'plugins' as const, name: '插件组件', description: '自定义插件组件' }

  for (const cap of capabilities) {
    const surfaceId = `gallery-plugin-${pluginId}-${cap.component_id}`
    const props: Record<string, any> = {}

    // Extract default values from props_schema
    if (cap.props_schema) {
      for (const [key, schema] of Object.entries(cap.props_schema)) {
        if (schema && typeof schema === 'object' && 'default' in schema) {
          props[key] = schema.default
        }
      }
    }

    const messages: ServerToClientMessage[] = [
      {
        surfaceUpdate: {
          surfaceId,
          components: [{
            id: 'root',
            component: {
              [cap.component_id]: props,
            },
          }],
        },
      },
      { beginRendering: { surfaceId, root: 'root' } },
    ]

    registerPluginGalleryExample({
      id: `plugin-${pluginId}-${cap.component_id}`,
      name: cap.name || cap.component_id,
      description: `${pluginName} — ${cap.name || cap.component_id}`,
      category: pluginsCategory,
      surfaceId,
      messages,
      pluginId,
      pluginName,
    })
  }
}
