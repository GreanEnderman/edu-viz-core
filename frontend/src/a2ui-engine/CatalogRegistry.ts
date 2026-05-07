import { CheckBox, ComponentRegistry, initializeDefaultCatalog } from '@a2ui/react'
import type { ComponentType } from 'react'
import {
  SHARED_RUNTIME_DEPENDENCIES,
  isSharedRuntimeDependency,
} from '../../../packages/plugin-runtime/src'
import { buildPluginGalleryExamples } from '../gallery/pluginGalleryRegistry'
import { fetchPlugins } from '../services/pluginService'
import type { Plugin } from '../types/plugin'
import reactSharedRuntimeUrl from '../plugin-runtime/react.shared.js?url'
import reactDomSharedRuntimeUrl from '../plugin-runtime/react-dom.shared.js?url'
import reactJsxRuntimeSharedRuntimeUrl from '../plugin-runtime/react-jsx-runtime.shared.js?url'
import a2uiReactSharedRuntimeUrl from '../plugin-runtime/a2ui-react.shared.js?url'

export function setupDefaultCatalog(): void {
  initializeDefaultCatalog()
  const registry = ComponentRegistry.getInstance()
  registry.register('Checkbox', { component: CheckBox })
}

type PluginIndexModule = {
  default?: {
    components?: Record<string, ComponentType>
  }
}

type RegistryComponent = Parameters<ComponentRegistry['register']>[1]['component']

const supportedSharedDependencies = new Set<string>(SHARED_RUNTIME_DEPENDENCIES)
const runtimeModuleUrls: Record<string, string> = {
  react: reactSharedRuntimeUrl,
  'react-dom': reactDomSharedRuntimeUrl,
  'react/jsx-runtime': reactJsxRuntimeSharedRuntimeUrl,
  '@a2ui/react': a2uiReactSharedRuntimeUrl,
}
const pluginModuleCache = new Map<string, Promise<PluginIndexModule>>()

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

function getPluginBundleUrl(plugin: Plugin): string | null {
  const entryJs = plugin.entry?.js
  if (!entryJs) return null
  return `/plugins/${plugin.id}/${entryJs.replace(/^\/+/, '')}`
}

function rewriteSharedRuntimeImports(source: string): string {
  return source.replace(
    /(from\s*["']|import\s*\(\s*["'])(react\/jsx-runtime|react-dom|react|@a2ui\/react)(["']\s*\)?)/g,
    (match, prefix: string, specifier: string, suffix: string) => {
      const runtimeUrl = runtimeModuleUrls[specifier]
      return runtimeUrl ? `${prefix}${runtimeUrl}${suffix}` : match
    },
  )
}

async function importPluginModule(plugin: Plugin): Promise<PluginIndexModule | null> {
  const bundleUrl = getPluginBundleUrl(plugin)
  if (!bundleUrl) {
    console.warn(`[CatalogRegistry] Plugin '${plugin.id}' is missing entry.js metadata`)
    return null
  }

  let modulePromise = pluginModuleCache.get(bundleUrl)
  if (!modulePromise) {
    modulePromise = (async () => {
      const response = await fetch(bundleUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch plugin bundle (${response.status}) from ${bundleUrl}`)
      }

      const rawSource = await response.text()
      const rewrittenSource = rewriteSharedRuntimeImports(rawSource)
      const blob = new Blob([rewrittenSource], { type: 'text/javascript' })
      const blobUrl = URL.createObjectURL(blob)

      try {
        return await import(/* @vite-ignore */ blobUrl)
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    })()
    pluginModuleCache.set(bundleUrl, modulePromise)
  }

  try {
    return await modulePromise
  } catch (error) {
    pluginModuleCache.delete(bundleUrl)
    throw error
  }
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

    let pluginModule: PluginIndexModule | null = null
    try {
      pluginModule = await importPluginModule(plugin)
    } catch (error) {
      console.error(`[CatalogRegistry] Failed to load bundle for plugin '${plugin.id}':`, error)
      continue
    }

    const pluginIndex = pluginModule?.default
    if (!pluginIndex?.components) {
      console.warn(`[CatalogRegistry] Plugin '${plugin.id}' bundle does not export a components map`)
      continue
    }

    const exportedComponents = pluginIndex.components
    const exportedCapabilityIds = new Set(Object.keys(exportedComponents))
    let hasRegisteredCapability = false

    for (const capability of plugin.capabilities) {
      const exportedComponent = exportedComponents[capability.component_id]
      if (!exportedComponent) {
        console.warn(
          `[CatalogRegistry] Plugin '${plugin.id}' bundle is missing capability export '${capability.component_id}'`,
        )
        continue
      }

      registry.register(capability.component_id, {
        component: exportedComponent as unknown as RegistryComponent,
      })
      hasRegisteredCapability = true
      exportedCapabilityIds.delete(capability.component_id)
    }

    for (const orphanComponentId of exportedCapabilityIds) {
      console.warn(
        `[CatalogRegistry] Plugin '${plugin.id}' exported undeclared component '${orphanComponentId}'`,
      )
    }

    const primaryCapabilityId = plugin.capabilities[0]?.component_id
    const primaryComponent = primaryCapabilityId ? exportedComponents[primaryCapabilityId] : undefined
    if (!hasRegisteredCapability || !primaryCapabilityId || !primaryComponent) {
      console.warn(`[CatalogRegistry] No usable component modules for plugin '${plugin.id}'`)
      continue
    }

    registry.register(plugin.id, {
      component: primaryComponent as unknown as RegistryComponent,
    })

    buildPluginGalleryExamples(plugin.id, plugin.name, plugin.capabilities)
  }
}
