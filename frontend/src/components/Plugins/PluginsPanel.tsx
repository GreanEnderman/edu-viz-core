import { useCallback, useEffect, useState } from 'react'
import { fetchPlugins, togglePlugin } from '../../services/pluginService'
import type { Plugin } from '../../types/plugin'

interface PluginsPanelProps {
  open: boolean
  onClose: () => void
}

export function PluginsPanel({ open, onClose }: PluginsPanelProps) {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadPlugins = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setPlugins(await fetchPlugins())
    } catch {
      setError('加载插件列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      void loadPlugins()
    }
  }, [loadPlugins, open])

  const handleToggle = async (pluginId: string) => {
    setTogglingId(pluginId)

    try {
      const result = await togglePlugin(pluginId)
      setPlugins((currentPlugins) =>
        currentPlugins.map((plugin) =>
          plugin.id === pluginId ? { ...plugin, enabled: result.enabled } : plugin,
        ),
      )
    } catch {
      setError('切换插件状态失败')
    } finally {
      setTogglingId(null)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-primary/5 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-outline-variant/15 bg-surface/80 shadow-[0px_20px_40px_rgba(27,28,26,0.08)] backdrop-blur-2xl">
        <div className="flex items-center justify-between px-8 pt-8 pb-6">
          <div>
            <h2 className="text-lg font-bold font-sans text-primary">插件</h2>
            <p className="mt-0.5 text-xs tracking-wide font-sans text-on-surface-variant/50">选择学科工具</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 transition-colors rounded-full hover:bg-primary/5"
            aria-label="关闭插件面板"
          >
            <span className="text-xl material-symbols-outlined text-on-surface-variant/60">close</span>
          </button>
        </div>

        <div className="flex-1 px-6 pb-8 overflow-y-auto no-scrollbar">
          {loading && <p className="py-12 text-sm text-center text-on-surface-variant/40 font-sans">加载中...</p>}
          {!loading && error && <p className="py-12 text-sm text-center text-on-surface-variant/50 font-sans">{error}</p>}
          {!loading && !error && plugins.length === 0 && (
            <p className="py-12 text-sm text-center text-on-surface-variant/40 font-sans">暂无可用插件</p>
          )}
          {!loading &&
            plugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                toggling={togglingId === plugin.id}
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
  onToggle: (id: string) => void
}

function PluginCard({ plugin, toggling, onToggle }: PluginCardProps) {
  return (
    <div className="p-5 mb-3 rounded-xl glass-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold truncate font-sans text-primary">{plugin.name}</span>
            <span className="px-2 py-0.5 rounded-full shrink-0 bg-secondary/8 text-[10px] font-sans text-secondary/70">
              {plugin.subject}
            </span>
          </div>
          <p className="text-xs leading-relaxed font-sans text-on-surface-variant/50">
            {plugin.capabilities.map((capability) => capability.name).join('、')}
          </p>
        </div>

        <button
          onClick={() => onToggle(plugin.id)}
          disabled={toggling}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
            plugin.enabled ? 'bg-primary' : 'bg-on-surface-variant/20'
          } ${toggling ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          aria-label={`${plugin.enabled ? '禁用' : '启用'} ${plugin.name}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              plugin.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
