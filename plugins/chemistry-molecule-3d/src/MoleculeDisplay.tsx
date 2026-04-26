import { useEffect, useRef, useState, useCallback } from 'react'
import $3Dmol from '3dmol'

interface A2UINode {
  properties?: Record<string, unknown>
}

interface MoleculeInfo {
  num_atoms: number
  num_bonds: number
  molecular_weight: number
  formula: string
}

function parseStr(val: unknown, fallback: string): string {
  return typeof val === 'string' ? val : fallback
}

interface Atom {
  element: string
  x: number
  y: number
  z: number
  index: number
}

interface Bond {
  atom1: number
  atom2: number
  order: number
}

interface MoleculeData {
  atoms: Atom[]
  bonds: Bond[]
  formula: string
  molecular_weight: number
  num_atoms: number
  num_bonds: number
}

function parseMoleculeData(val: unknown): MoleculeData | null {
  if (!val || typeof val !== 'object') return null
  const obj = val as Record<string, unknown>
  const atoms = obj.atoms
  const bonds = obj.bonds
  if (!Array.isArray(atoms) || !Array.isArray(bonds)) return null
  return {
    atoms: atoms.map((a: any) => ({
      element: String(a.element ?? 'C'),
      x: Number(a.x) || 0,
      y: Number(a.y) || 0,
      z: Number(a.z) || 0,
      index: Number(a.index) || 0,
    })),
    bonds: bonds.map((b: any) => ({
      atom1: Number(b.atom1) || 0,
      atom2: Number(b.atom2) || 0,
      order: Number(b.order) || 1,
    })),
    formula: String(obj.formula ?? ''),
    molecular_weight: Number(obj.molecular_weight) || 0,
    num_atoms: Number(obj.num_atoms) || 0,
    num_bonds: Number(obj.num_bonds) || 0,
  }
}

// Build SDF from atom/bond data
function buildSDF(data: MoleculeData): string {
  const atomLines = data.atoms.map((a, i) =>
    `${a.x.toFixed(4).padStart(10)}${a.y.toFixed(4).padStart(10)}${a.z.toFixed(4).padStart(10)} ${a.element.padEnd(3)} 0  0  0  0  0  0  0  0  0  0  0  0`
  )
  const bondLines = data.bonds.map(b =>
    `${(b.atom1 + 1).toString().padStart(3)}${(b.atom2 + 1).toString().padStart(3)}${b.order}  0  0  0`
  )

  const numAtoms = data.atoms.length
  const numBonds = data.bonds.length
  const countsLine = `${numAtoms.toString().padStart(3)}${numBonds.toString().padStart(3)}  0  0  0  0  0  0  0  0  1 V2000`

  let sdf = ''
  sdf += '\n'
  sdf += '     RDKit          3D\n'
  sdf += '\n'
  sdf += countsLine + '\n'
  for (const line of atomLines) sdf += line + '\n'
  for (const line of bondLines) sdf += line + '\n'
  sdf += 'M  END\n'
  sdf += '$$$$\n'

  return sdf
}

export default function MoleculeDisplay({ node }: { node: A2UINode }) {
  const props = node.properties ?? {}
  const smiles = parseStr(props.smiles, '')
  const rawMoleculeData = props.moleculeData

  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  const [currentSmiles, setCurrentSmiles] = useState('')
  const [style, setStyle] = useState<'stick' | 'sphere'>('stick')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState<MoleculeInfo | null>(null)

  // Init 3Dmol viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return
    try {
      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#f8fafc',
      })
      viewer.setBackgroundColor('#f8fafc')
      viewerRef.current = viewer
    } catch {
      // 3Dmol not ready, will retry
    }
  }, [])

  // Apply style to viewer
  const applyStyle = useCallback((s: 'stick' | 'sphere') => {
    const viewer = viewerRef.current
    if (!viewer) return
    if (s === 'stick') {
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
  }, [])

  // Visualize molecule from data
  useEffect(() => {
    if (rawMoleculeData) {
      const data = parseMoleculeData(rawMoleculeData)
      if (!data) return

      // Wait for viewer
      let attempts = 0
      const waitForViewer = () => {
        if (viewerRef.current) {
          const viewer = viewerRef.current
          viewer.clear()

          // Build SDF and load into 3Dmol
          const sdf = buildSDF(data)
          viewer.addModel(sdf, 'sdf')

          applyStyle(style)
          viewer.zoomTo()
          viewer.render()

          setCurrentSmiles(smiles)
          setInfo({
            formula: data.formula,
            molecular_weight: data.molecular_weight,
            num_atoms: data.num_atoms,
            num_bonds: data.num_bonds,
          })
          setLoading(false)
          setError('')
        } else if (attempts < 50) {
          attempts++
          setTimeout(waitForViewer, 100)
        } else {
          setError('3D viewer initialization failed')
          setLoading(false)
        }
      }
      setLoading(true)
      waitForViewer()
      return
    }

    if (!smiles) {
      setCurrentSmiles('')
      setInfo(null)
      setLoading(false)
      setError('')
    } else {
      setLoading(true)
      setError('')
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || '/api'
      fetch(`${apiBase}/v1/plugins/chemistry-molecule-3d/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse_structure', payload: { smiles } }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('[MoleculeDisplay] Backend response:', data)
          if (!data.success) {
            setError(data.error || `解析失败: ${smiles}`)
            setLoading(false)
            return
          }
          // 数据在 data.data 中
          const responseData = data.data
          const molData: MoleculeData = {
            atoms: responseData.atoms.map((a: any) => ({ element: a.element, x: a.x, y: a.y, z: a.z, index: a.index })),
            bonds: responseData.bonds.map((b: any) => ({ atom1: b.atom1, atom2: b.atom2, order: b.order })),
            formula: responseData.formula,
            molecular_weight: responseData.molecular_weight,
            num_atoms: responseData.num_atoms,
            num_bonds: responseData.num_bonds,
          }
          // Reuse same rendering logic as rawMoleculeData branch
          let attempts = 0
          const waitForViewer = () => {
            const viewer = viewerRef.current
            if (viewer) {
              viewer.clear()
              viewer.addModel(buildSDF(molData), 'sdf')
              applyStyle(style)
              viewer.zoomTo()
              viewer.render()
              setCurrentSmiles(responseData.smiles || smiles)
              setInfo({ formula: molData.formula, molecular_weight: molData.molecular_weight, num_atoms: molData.num_atoms, num_bonds: molData.num_bonds })
              setLoading(false)
            } else if (attempts < 50) {
              attempts++
              setTimeout(waitForViewer, 100)
            } else {
              setError('3D viewer initialization failed')
              setLoading(false)
            }
          }
          waitForViewer()
        })
        .catch((err) => { setError(`请求失败: ${err.message}`); setLoading(false) })
    }
  }, [smiles, rawMoleculeData, style, applyStyle])

  // Style change
  const handleStyleChange = (s: 'stick' | 'sphere') => {
    setStyle(s)
    setTimeout(() => applyStyle(s), 0)
  }

  const handleReset = () => {
    viewerRef.current?.zoomTo()
  }

  const btnBase: React.CSSProperties = {
    flex: 1, padding: '6px 8px', background: '#f1f5f9',
    border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12,
    fontFamily: 'Manrope, sans-serif', color: '#64748b', cursor: 'pointer',
    transition: 'all 0.2s',
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      background: '#faf9f5', borderRadius: 12, padding: 12,
      fontFamily: 'Manrope, sans-serif', color: '#1b1c1a',
    }}>
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
            {smiles ? `正在解析 ${smiles}...` : '等待分子数据...'}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && (
        <div style={{
          padding: 10, background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444', borderRadius: 8,
          fontSize: 13, color: '#ef4444',
        }}>{error}</div>
      )}

      <div style={{
        position: 'relative', height: 280, background: '#f8fafc',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {currentSmiles && !loading && !error && info && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['分子式', info.formula],
            ['分子量', info.molecular_weight ? `${info.molecular_weight} Da` : '-'],
            ['原子数', String(info.num_atoms)],
            ['化学键数', String(info.num_bonds)],
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

      {currentSmiles && !loading && !error && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleStyleChange('stick')}
            style={{
              ...btnBase,
              background: style === 'stick' ? '#182544' : '#f1f5f9',
              color: style === 'stick' ? '#ffffff' : '#64748b',
              border: style === 'stick' ? 'none' : '1px solid #e2e8f0',
            }}
          >
            球棍模型
          </button>
          <button
            onClick={() => handleStyleChange('sphere')}
            style={{
              ...btnBase,
              background: style === 'sphere' ? '#182544' : '#f1f5f9',
              color: style === 'sphere' ? '#ffffff' : '#64748b',
              border: style === 'sphere' ? 'none' : '1px solid #e2e8f0',
            }}
          >
            空间填充
          </button>
          <button onClick={handleReset} style={btnBase}>
            重置视图
          </button>
        </div>
      )}
    </div>
  )
}
