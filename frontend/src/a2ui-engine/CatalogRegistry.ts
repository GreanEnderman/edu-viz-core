import { CheckBox, ComponentRegistry, initializeDefaultCatalog } from '@a2ui/react'
import type { ComponentType } from 'react'
import {
  SHARED_RUNTIME_DEPENDENCIES,
  isSharedRuntimeDependency,
} from '../../../packages/plugin-runtime/src'
import { buildPluginGalleryExamples } from '../gallery/pluginGalleryRegistry'
import { fetchPlugins } from '../services/pluginService'
import type { Plugin } from '../types/plugin'

export function setupDefaultCatalog(): void {
  initializeDefaultCatalog()
  const registry = ComponentRegistry.getInstance()
  registry.register('Checkbox', { component: CheckBox })
}

type PluginComponentModule = { default: ComponentType }
type PluginIndexModule = {
  default?: {
    components?: Record<string, ComponentType>
  }
}

type RegistryComponent = Parameters<ComponentRegistry['register']>[1]['component']

const pluginComponentModules = import.meta.glob<PluginComponentModule>(
  '../../../plugins/*/src/*.{ts,tsx}',
)
const pluginIndexModules = import.meta.glob<PluginIndexModule>(
  '../../../plugins/*/src/index.ts',
)

const supportedSharedDependencies = new Set<string>(SHARED_RUNTIME_DEPENDENCIES)

function getPluginComponentLoader(
  pluginId: string,
  componentId: string,
): (() => Promise<PluginComponentModule>) | undefined {
  const preferredPath = `../../../plugins/${pluginId}/src/${componentId}.tsx`
  const fallbackPath = `../../../plugins/${pluginId}/src/${componentId}.ts`

  return pluginComponentModules[preferredPath] ?? pluginComponentModules[fallbackPath]
}

function getPluginIndexLoader(pluginId: string): (() => Promise<PluginIndexModule>) | undefined {
  return pluginIndexModules[`../../../plugins/${pluginId}/src/index.ts`]
}

function validateSharedDependencies(plugin: Plugin): boolean {
  for (const dependency of plugin.sharedDependencies ?? []) {
    if (!supportedSharedDependencies.has(dependency) || !isSharedRuntimeDependency(dependency)) {
      console.warn(
        `[CatalogRegistry] Plugin '${plugin.id}' requested unsupported shared dependency '${dependency}'`,
      )
      return false
    }
  }

  return true
}

export async function loadPluginComponents(): Promise<void> {
  let plugins: Plugin[]
  try {
    plugins = await fetchPlugins()
  } catch (error) {
    console.error('[CatalogRegistry] Error fetching plugins:', error)
    return
  }

  const registry = ComponentRegistry.getInstance()
  const enabledPlugins = plugins.filter((plugin) => plugin.enabled)

  for (const plugin of enabledPlugins) {
    if (!validateSharedDependencies(plugin)) {
      continue
    }

    const pluginIndex = (await getPluginIndexLoader(plugin.id)?.())?.default
    const exportedComponents = pluginIndex?.components ?? {}
    let hasRegisteredCapability = false

    for (const capability of plugin.capabilities) {
      const exportedComponent = exportedComponents[capability.component_id]
      if (exportedComponent) {
        registry.register(capability.component_id, {
          component: exportedComponent as unknown as RegistryComponent,
        })
        hasRegisteredCapability = true
        continue
      }

      const directLoader = getPluginComponentLoader(plugin.id, capability.component_id)
      if (!directLoader) {
        console.warn(
          `[CatalogRegistry] No module for plugin '${plugin.id}' capability '${capability.component_id}'`,
        )
        continue
      }

      const module = await directLoader()
      registry.register(capability.component_id, {
        component: module.default as unknown as RegistryComponent,
      })
      hasRegisteredCapability = true
    }

    const primaryCapabilityId = plugin.capabilities[0]?.component_id
    if (!hasRegisteredCapability || !primaryCapabilityId) {
      console.warn(`[CatalogRegistry] No usable component modules for plugin '${plugin.id}'`)
      continue
    }

    const primaryComponent = exportedComponents[primaryCapabilityId]
    if (primaryComponent) {
      registry.register(plugin.id, {
        component: primaryComponent as unknown as RegistryComponent,
      })
    } else {
      const loader = getPluginComponentLoader(plugin.id, primaryCapabilityId)
      if (loader) {
        const module = await loader()
        registry.register(plugin.id, {
          component: module.default as unknown as RegistryComponent,
        })
      }
    }

    buildPluginGalleryExamples(plugin.id, plugin.name, plugin.capabilities)
  }
}
