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

// Static imports for plugin components (Phase B: bundled with host)
// Each plugin module exports its component as default
// @ts-expect-error -- React type mismatch between plugin and host (shared instance at runtime)
const pluginModules: Record<string, { default: ComponentType }> = {
  'physics-high-school': await import('@plugins/physics-high-school/src/PhysicsOscillator'),
}

/**
 * Register plugin components based on user's enabled plugins.
 * Phase B: uses static imports (all plugins bundled with frontend).
 * Phase A (future): Vite plugin virtual module for dynamic loading.
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
    const mod = pluginModules[plugin.id]
    if (!mod) {
      console.warn(`[CatalogRegistry] No module for plugin '${plugin.id}'`)
      continue
    }
    const component = mod.default
    // Register by plugin id
    registry.register(plugin.id, { component: component as any })
    // Register by each capability's component_id (this is what LLM uses in A2UI JSONL)
    for (const cap of plugin.capabilities) {
      registry.register(cap.component_id, { component: component as any })
      console.info(`[CatalogRegistry] Registered plugin component: ${cap.component_id}`)
    }
    // Auto-register gallery preview for this plugin
    buildPluginGalleryExamples(plugin.id, plugin.name, plugin.capabilities)
  }
}
