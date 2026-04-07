import { useState, useEffect, useCallback } from 'react'
import { fetchPlugins, togglePlugin, type Plugin } from '../../api/plugins'

interface PluginsPanelProps {
  open: boolean
  onClose: () => void
}

export function PluginsPanel({ open, onClose }: PluginsPanelProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPlugins()
      setPlugins(data)
    } catch {
      setError('加载插件列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  const handleToggle = async (pluginId: string, currentEnabled: boolean) => {
    setToggling(pluginId)
    try {
      const result = await togglePlugin(pluginId)
      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, enabled: result.enabled } : p))
      )
    } catch {
      // revert optimistic UI — already not changed since we toggle after API
      setError(`切换插件状态失败`)
    } finally {
      setToggling(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-primary/5 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col bg-surface/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(27,28,26,0.08)] border-l border-outline-variant/15">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div>
            <h2 className="font-sans font-bold text-lg text-primary">插件</h2>
            <p className="font-sans text-xs text-on-surface-variant/50 mt-0.5 tracking-wide">
              选择学科工具
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant/60 text-xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
          {loading && (
            <p className="font-sans text-sm text-on-surface-variant/40 text-center py-12">加载中…</p>
          )}

          {!loading && error && (
            <p className="font-sans text-sm text-on-surface-variant/50 text-center py-12">{error}</p>
          )}

          {!loading && !error && plugins.length === 0 && (
            <p className="font-sans text-sm text-on-surface-variant/40 text-center py-12">暂无可用插件</p>
          )}

          {!loading && plugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              toggling={toggling === plugin.id}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>
    </>
  )
}

interface PluginCardProps {
  plugin: Plugin
  toggling: boolean
  onToggle: (id: string, enabled: boolean) => void
}

function PluginCard({ plugin, toggling, onToggle }: PluginCardProps) {
  return (
    <div className="glass-panel rounded-xl p-5 mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-sans font-semibold text-sm text-primary truncate">{plugin.name}</span>
            <span className="font-sans text-[10px] text-secondary/70 bg-secondary/8 px-2 py-0.5 rounded-full shrink-0">
              {plugin.subject}
            </span>
          </div>
          <p className="font-sans text-xs text-on-surface-variant/50 leading-relaxed">
            {plugin.capabilities.map((c) => c.name).join('、')}
          </p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(plugin.id, plugin.enabled)}
          disabled={toggling}
          className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
            plugin.enabled ? 'bg-primary' : 'bg-on-surface-variant/20'
          } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              plugin.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
