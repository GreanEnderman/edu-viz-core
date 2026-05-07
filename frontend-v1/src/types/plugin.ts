export interface PluginCapability {
  component_id: string
  name: string
  tags?: string[]
  props_schema?: Record<string, unknown>
}

export interface Plugin {
  id: string
  name: string
  version: string
  subject: string
  keywords: string[]
  capabilities: PluginCapability[]
  enabled: boolean
  sharedDependencies?: string[]
  entry?: { js?: string }
}
