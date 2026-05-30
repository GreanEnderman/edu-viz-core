import * as A2UIReact from '@a2ui/react'
import * as React from 'react'
import * as ReactDom from 'react-dom'
import * as ReactDomClient from 'react-dom/client'
import * as ReactJsxRuntime from 'react/jsx-runtime'
import type { ComponentType } from 'react'
import {
  SHARED_RUNTIME_DEPENDENCIES,
  isSharedRuntimeDependency,
} from '../../../packages/plugin-runtime/src'
import { buildPluginGalleryExamples } from '../gallery/pluginGalleryRegistry'
import { fetchPlugins } from '../services/pluginService'
import type { Plugin } from '../types/plugin'

export function setupDefaultCatalog(): void {
  A2UIReact.initializeDefaultCatalog()
  const registry = A2UIReact.ComponentRegistry.getInstance()
  registry.register('Checkbox', { component: A2UIReact.CheckBox })
}

type PluginIndexModule = {
  default?: {
    components?: Record<string, ComponentType>
  }
}

type ComponentRegistryInstance = ReturnType<typeof A2UIReact.ComponentRegistry.getInstance>
type RegistryComponent = Parameters<ComponentRegistryInstance['register']>[1]['component']

const supportedSharedDependencies = new Set<string>(SHARED_RUNTIME_DEPENDENCIES)
const pluginModuleCache = new Map<string, Promise<PluginIndexModule>>()
const runtimeModuleUrlCache = new Map<string, string>()

function getRuntimeModuleUrl(specifier: string): string | undefined {
  const cachedUrl = runtimeModuleUrlCache.get(specifier)
  if (cachedUrl) return cachedUrl

  const namespaces: Record<string, Record<string, unknown>> = {
    react: React,
    'react-dom': ReactDom,
    'react-dom/client': ReactDomClient,
    'react/jsx-runtime': ReactJsxRuntime,
    '@a2ui/react': A2UIReact,
  }

  const namespace = namespaces[specifier]
  if (!namespace) return undefined

  const registryKey = `__plugin_runtime_${specifier.replace(/[^a-z0-9_]/gi, '_')}`
  ;(globalThis as Record<string, unknown>)[registryKey] = namespace

  const lines = [`const moduleRef = globalThis[${JSON.stringify(registryKey)}];`]
  const exportNames = Object.keys(namespace).filter(
    (name) => name !== 'default' && /^[$A-Z_][0-9A-Z_$]*$/i.test(name),
  )

  for (const exportName of exportNames) {
    lines.push(`export const ${exportName} = moduleRef[${JSON.stringify(exportName)}];`)
  }

  if ('default' in namespace) {
    lines.push('export default moduleRef.default;')
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/javascript' })
  const blobUrl = URL.createObjectURL(blob)
  runtimeModuleUrlCache.set(specifier, blobUrl)
  return blobUrl
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

function getPluginBundleUrl(plugin: Plugin): string | null {
  const entryJs = plugin.entry?.js
  if (!entryJs) return null
  const cacheKey = import.meta.env.DEV ? `${plugin.version}-${Date.now()}` : plugin.version
  const version = cacheKey ? `?v=${encodeURIComponent(cacheKey)}` : ''
  return `/plugins/${plugin.id}/${entryJs.replace(/^\/+/, '')}${version}`
}

function rewriteSharedRuntimeImports(source: string): string {
  const runtimeModuleUrls: Record<string, string> = {}
  for (const specifier of SHARED_RUNTIME_DEPENDENCIES) {
    const url = getRuntimeModuleUrl(specifier)
    if (url) runtimeModuleUrls[specifier] = url
  }

  const jsxRuntimeUrl = getRuntimeModuleUrl('react/jsx-runtime')
  if (jsxRuntimeUrl) runtimeModuleUrls['react/jsx-runtime'] = jsxRuntimeUrl

  const reactDomClientUrl = getRuntimeModuleUrl('react-dom/client')
  if (reactDomClientUrl) runtimeModuleUrls['react-dom/client'] = reactDomClientUrl

  const runtimeSpecifiers = Object.keys(runtimeModuleUrls)
    .sort((left, right) => right.length - left.length)
    .map((specifier) => specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')

  const sharedRuntimePattern = new RegExp(
    `(from\\s*["']|import\\(\\s*["'])(${runtimeSpecifiers}|\\/src\\/plugin-runtime\\/(?:react|react-dom|react-dom-client|react-jsx-runtime|a2ui-react)\\.shared\\.js|${window.location.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/src\\/plugin-runtime\\/(?:react|react-dom|react-dom-client|react-jsx-runtime|a2ui-react)\\.shared\\.js)(["']\\s*\\)?)`,
    'g',
  )

  const legacySpecifierMap: Record<string, string> = {
    '/src/plugin-runtime/react.shared.js': runtimeModuleUrls.react,
    '/src/plugin-runtime/react-dom.shared.js': runtimeModuleUrls['react-dom'],
    '/src/plugin-runtime/react-dom-client.shared.js': runtimeModuleUrls['react-dom/client'],
    '/src/plugin-runtime/react-jsx-runtime.shared.js': runtimeModuleUrls['react/jsx-runtime'],
    '/src/plugin-runtime/a2ui-react.shared.js': runtimeModuleUrls['@a2ui/react'],
    [`${window.location.origin}/src/plugin-runtime/react.shared.js`]: runtimeModuleUrls.react,
    [`${window.location.origin}/src/plugin-runtime/react-dom.shared.js`]:
      runtimeModuleUrls['react-dom'],
    [`${window.location.origin}/src/plugin-runtime/react-dom-client.shared.js`]:
      runtimeModuleUrls['react-dom/client'],
    [`${window.location.origin}/src/plugin-runtime/react-jsx-runtime.shared.js`]:
      runtimeModuleUrls['react/jsx-runtime'],
    [`${window.location.origin}/src/plugin-runtime/a2ui-react.shared.js`]:
      runtimeModuleUrls['@a2ui/react'],
  }

  return source.replace(
    sharedRuntimePattern,
    (match, prefix: string, specifier: string, suffix: string) => {
      const runtimeUrl = legacySpecifierMap[specifier] ?? runtimeModuleUrls[specifier]
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
      const response = await fetch(bundleUrl, { cache: 'no-store' })
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

  const registry = A2UIReact.ComponentRegistry.getInstance()
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
