import { initializeDefaultCatalog, ComponentRegistry, CheckBox } from '@a2ui/react'
import type { ComponentType } from 'react'
import { buildPluginGalleryExamples } from '../gallery/pluginGalleryRegistry'

export function setupDefaultCatalog(): void {
  initializeDefaultCatalog()
  // A2UI schema uses "Checkbox" (lowercase b) but default catalog registers "CheckBox" (uppercase B).
  // Register the alias so LLM-generated "Checkbox" resolves correctly.
  const registry = ComponentRegistry.getInstance()
  registry.register('Checkbox', { component: CheckBox })
}

interface PluginListItem {
  id: string
  name: string
  enabled: boolean
  capabilities: Array<{ component_id: string; name: string; props_schema?: Record<string, any> }>
  entry?: { js?: string }
}

type PluginComponentModule = { default: ComponentType }

const pluginComponentModules = import.meta.glob<PluginComponentModule>(
  '../../../plugins/*/src/*.{ts,tsx}',
)

function getPluginComponentLoader(
  pluginId: string,
  componentId: string,
): (() => Promise<PluginComponentModule>) | undefined {
  const preferredPath = `../../../plugins/${pluginId}/src/${componentId}.tsx`
  const fallbackPath = `../../../plugins/${pluginId}/src/${componentId}.ts`

  return pluginComponentModules[preferredPath] ?? pluginComponentModules[fallbackPath]
}

/**
 * Register plugin components based on user's enabled plugins.
 * Plugin component modules are discovered from the plugins directory and matched by capability.component_id.
 */
export async function loadPluginComponents(): Promise<void> {
  const apiBase = import.meta.env.VITE_API_BASE ?? '/api'
  let plugins: PluginListItem[]
  try {
    const res = await apiBase.startsWith('/api') ? await fetch(apiBase + '/v1/plugins') : await fetch(`${apiBase}/v1/plugins`)
    if (!res.ok) {
      console.error('[CatalogRegistry] Failed to fetch plugins:', res.status)
      return
    }
    plugins = await res.json()
  } catch (err) {
    console.error('[CatalogRegistry] Error fetching plugins:', err)
    return
  }

  const registry = ComponentRegistry.getInstance()
  const enabled = plugins.filter((p) => p.enabled)

  for (const plugin of enabled) {
    let registeredAnyCapability = false

    for (const cap of plugin.capabilities) {
      const loader = getPluginComponentLoader(plugin.id, cap.component_id)
      if (!loader) {
        console.warn(
          `[CatalogRegistry] No module for plugin '${plugin.id}' capability '${cap.component_id}'`
        )
        continue
      }

      const mod = await loader()
      const component = mod.default
      registry.register(cap.component_id, { component: component as any })
      console.info(`[CatalogRegistry] Registered plugin component: ${cap.component_id}`)
      registeredAnyCapability = true
    }

    const primaryCapabilityId = plugin.capabilities[0]?.component_id
    if (registeredAnyCapability && primaryCapabilityId) {
      const loader = getPluginComponentLoader(plugin.id, primaryCapabilityId)
      if (loader) {
        const mod = await loader()
        registry.register(plugin.id, { component: mod.default as any })
      }
    } else {
      console.warn(`[CatalogRegistry] No usable component modules for plugin '${plugin.id}'`)
      continue
    }

    // Auto-register gallery preview for this plugin
    buildPluginGalleryExamples(plugin.id, plugin.name, plugin.capabilities)
  }
}
