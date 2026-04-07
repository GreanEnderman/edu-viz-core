const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface PluginCapabilitySummary {
  component_id: string
  name: string
  tags: string[]
}

export interface Plugin {
  id: string
  name: string
  version: string
  subject: string
  keywords: string[]
  capabilities: PluginCapabilitySummary[]
  enabled: boolean
}

export async function fetchPlugins(): Promise<Plugin[]> {
  const res = await fetch(`${API_BASE}/v1/plugins`)
  if (!res.ok) throw new Error(`Failed to fetch plugins: ${res.status}`)
  return res.json()
}

export async function togglePlugin(pluginId: string): Promise<{ plugin_id: string; enabled: boolean }> {
  const res = await fetch(`${API_BASE}/v1/plugins/${pluginId}/toggle`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to toggle plugin: ${res.status}`)
  return res.json()
}
