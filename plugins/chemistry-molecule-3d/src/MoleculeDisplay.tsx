import { useEffect, useRef, useState } from 'react'

interface A2UINode {
  properties?: Record<string, unknown>
}

interface MoleculeInfo {
  num_atoms: number
  num_bonds: number
  molecular_weight: number
  formula: string
}

declare const $3Dmol: any

const API_BASE = 'http://localhost:8001'
const THREE_DMOL_CDN = 'https://3dmol.org/build/3Dmol-min.js'

function parseStr(val: unknown, fallback: string): string {
  return typeof val === 'string' ? val : fallback
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export default function MoleculeDisplay({ node }: { node: A2UINode }) {
  const props = node.properties ?? {}
  const smiles = parseStr(props.smiles, '')

  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  const [currentSmiles, setCurrentSmiles] = useState('')
  const [style, setStyle] = useState<'stick' | 'sphere'>('stick')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState<MoleculeInfo | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  // Load 3Dmol.js
  useEffect(() => {
    loadScript(THREE_DMOL_CDN).then(() => setScriptReady(true))
  }, [])

  // Init viewer
  useEffect(() => {
    if (!scriptReady || !containerRef.current || viewerRef.current) return
    try {
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#f8fafc',
      })
      viewer.setBackgroundColor('#f8fafc')
      viewerRef.current = viewer
    } catch {
      // 3Dmol not ready yet, will retry on next render
    }
  }, [scriptReady])

  // Apply style
  const applyStyle = () => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (style === 'stick') {
      viewer.setStyle({}, {
        sphere: { scale: 0.25, colorscheme: 'Jmol' },
        stick: { radius: 0.12, colorscheme: 'Jmol' },
      })
    } else {
      viewer.setStyle({}, {
        sphere: { scale: 0.8, colorscheme: 'Jmol' },
      })
    }
    viewer.render()
  }

  // Visualize when smiles changes
  useEffect(() => {
    if (!smiles || !viewerRef.current) {
      if (!smiles) {
        setCurrentSmiles('')
        setInfo(null)
        setError('')
      }
      return
    }

    if (smiles === currentSmiles) return

    let cancelled = false
    const viewer = viewerRef.current

    async function visualize() {
      setLoading(true)
      setError('')
      try {
        const parseRes = await fetch(`${API_BASE}/parse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ smiles }),
        })
        if (!parseRes.ok) {
          const err = await parseRes.json()
          throw new Error(err.detail || 'Failed to parse SMILES')
        }
        const result = await parseRes.json()
        if (!result.success || !result.sdf) {
          throw new Error('Unable to generate 3D structure')
        }
        if (cancelled) return

        viewer.clear()
        viewer.addModel(result.sdf, 'sdf')
        applyStyle()
        viewer.zoomTo()
        viewer.render()

        setCurrentSmiles(smiles)

        // Fetch molecule info
        try {
          const infoRes = await fetch(`${API_BASE}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ smiles }),
          })
          if (infoRes.ok) {
            const moleculeInfo = await infoRes.json()
            if (!cancelled) setInfo(moleculeInfo)
          }
        } catch {
          // info fetch failed, not critical
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Unable to display molecule')
        }
      } finally {
        setLoading(false)
      }
    }

    visualize()
    return () => { cancelled = true }
  }, [smiles, scriptReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStyleChange = (s: 'stick' | 'sphere') => {
    setStyle(s)
    // applyStyle will run on next render after state update
    setTimeout(() => applyStyle(), 0)
  }

  const handleReset = () => {
    viewerRef.current?.zoomTo()
  }

  const btnBase: React.CSSProperties = {
    flex: 1,
    padding: '6px 8px',
    background: style === 'stick' || style === 'sphere' ? '#f1f5f9' : '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'Manrope, sans-serif',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      background: '#faf9f5',
      borderRadius: 12,
      padding: 12,
      fontFamily: 'Manrope, sans-serif',
      color: '#1b1c1a',
    }}>
      {/* Loading */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: 32,
        }}>
          <div style={{
            width: 36, height: 36,
            border: '3px solid #e2e8f0', borderTopColor: '#182544',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
          <div style={{ fontSize: 13, color: '#64748b' }}>
            正在生成分子结构...
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Empty state */}
      {!currentSmiles && !loading && !error && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, opacity: 0.5 }}>&#x1f52c;</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            等待分子数据...
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: 10,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: 8,
          fontSize: 13,
          color: '#ef4444',
        }}>
          {error}
        </div>
      )}

      {/* 3D Canvas */}
      {currentSmiles && !loading && !error && (
        <div style={{
          position: 'relative',
          height: 280,
          background: '#f8fafc',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {/* Molecule Info */}
      {currentSmiles && !loading && !error && info && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['分子式', info.formula],
            ['分子量', info.molecular_weight ? `${info.molecular_weight} Da` : '-'],
            ['原子数', String(info.num_atoms)],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 10px', background: '#f8fafc', borderRadius: 6,
            }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
              <span style={{
                fontSize: 13, color: '#1e293b', fontWeight: 500,
                fontFamily: 'monospace',
              }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Style Controls */}
      {currentSmiles && !loading && !error && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleStyleChange('stick')}
            style={{
              ...btnBase,
              background: style === 'stick' ? '#182544' : '#f1f5f9',
              borderColor: style === 'stick' ? '#182544' : '#e2e8f0',
              color: style === 'stick' ? '#fff' : '#64748b',
            }}
          >
            球棍模型
          </button>
          <button
            onClick={() => handleStyleChange('sphere')}
            style={{
              ...btnBase,
              background: style === 'sphere' ? '#182544' : '#f1f5f9',
              borderColor: style === 'sphere' ? '#182544' : '#e2e8f0',
              color: style === 'sphere' ? '#fff' : '#64748b',
            }}
          >
            空间填充
          </button>
          <button
            onClick={handleReset}
            style={btnBase}
          >
            重置视图
          </button>
        </div>
      )}
    </div>
  )
}
