import { requestJson } from './http'
import type { Plugin } from '../types/plugin'

export function fetchPlugins() {
  return requestJson<Plugin[]>('/v1/plugins')
}

export function togglePlugin(pluginId: string) {
  return requestJson<{ plugin_id: string; enabled: boolean }>(
    `/v1/plugins/${pluginId}/toggle`,
    { method: 'POST' },
  )
}
