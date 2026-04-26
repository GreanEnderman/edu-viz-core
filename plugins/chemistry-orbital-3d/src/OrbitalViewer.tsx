import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface A2UINode {
  properties?: Record<string, unknown>
}

function parseStr(val: unknown, fallback: string): string {
  return typeof val === 'string' ? val : fallback
}
function parseNum(val: unknown, fallback: number): number {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

// ===== Math functions (from original Vue) =====

function factorial(n: number): number {
  if (n <= 1) return 1
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

function doubleFactorial(n: number): number {
  if (n <= 0) return 1
  let r = 1
  for (let i = n; i > 0; i -= 2) r *= i
  return r
}

function associatedLaguerre(n: number, alpha: number, x: number): number {
  if (n === 0) return 1
  if (n === 1) return 1 + alpha - x
  let L0 = 1, L1 = 1 + alpha - x, L2 = 0
  for (let k = 2; k <= n; k++) {
    L2 = ((2 * k - 1 + alpha - x) * L1 - (k - 1 + alpha) * L0) / k
    L0 = L1; L1 = L2
  }
  return L2
}

function associatedLegendre(l: number, m: number, x: number): number {
  const absM = Math.abs(m)
  if (absM > l) return 0
  let pmm = 1.0
  if (absM > 0) {
    const somx2 = Math.sqrt((1 - x) * (1 + x))
    let fact = 1.0
    for (let i = 1; i <= absM; i++) { pmm *= -fact * somx2; fact += 2.0 }
  }
  if (l === absM) return pmm
  let pmmp1 = x * (2 * absM + 1) * pmm
  if (l === absM + 1) return pmmp1
  let pll = 0
  for (let ll = absM + 2; ll <= l; ll++) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + absM - 1) * pmm) / (ll - absM)
    pmm = pmmp1; pmmp1 = pll
  }
  return pll
}

function getRadialWavefunction(n: number, l: number, r: number, Z: number): number {
  const a0 = 1.0
  const rho = (2 * Z * r) / (n * a0)
  const coeff = Math.sqrt(Math.pow(2 * Z / (n * a0), 3) * factorial(n - l - 1) / (2 * n * factorial(n + l)))
  return coeff * Math.pow(rho, l) * Math.exp(-rho / 2) * associatedLaguerre(n - l - 1, 2 * l + 1, rho)
}

function getSphericalHarmonic(l: number, m: number, type: string | undefined, theta: number, phi: number): number {
  const ct = Math.cos(theta), st = Math.sin(theta)
  if (type) {
    if (l === 0) return 1 / Math.sqrt(4 * Math.PI)
    if (l === 1) {
      if (type === 'x') return Math.sqrt(3 / (4 * Math.PI)) * st * Math.cos(phi)
      if (type === 'y') return Math.sqrt(3 / (4 * Math.PI)) * st * Math.sin(phi)
      if (type === 'z') return Math.sqrt(3 / (4 * Math.PI)) * ct
    } else if (l === 2) {
      if (type === 'z2') return Math.sqrt(5 / (16 * Math.PI)) * (3 * ct * ct - 1)
      if (type === 'xz') return Math.sqrt(15 / (4 * Math.PI)) * st * ct * Math.cos(phi)
      if (type === 'yz') return Math.sqrt(15 / (4 * Math.PI)) * st * ct * Math.sin(phi)
      if (type === 'xy') return Math.sqrt(15 / (4 * Math.PI)) * st * st * Math.sin(phi) * Math.cos(phi)
      if (type === 'x2-y2') return Math.sqrt(15 / (16 * Math.PI)) * st * st * Math.cos(2 * phi)
    } else if (l === 3) {
      const s2 = st * st, c2 = ct * ct
      if (type === 'z3') return Math.sqrt(7 / (16 * Math.PI)) * (5 * c2 * ct - 3 * ct)
      if (type === 'xz2') return Math.sqrt(21 / (32 * Math.PI)) * (5 * c2 - 1) * st * Math.cos(phi)
      if (type === 'yz2') return Math.sqrt(21 / (32 * Math.PI)) * (5 * c2 - 1) * st * Math.sin(phi)
      if (type === 'xyz') return Math.sqrt(105 / (4 * Math.PI)) * s2 * ct * Math.sin(phi) * Math.cos(phi)
      if (type === 'z(x2-y2)') return Math.sqrt(105 / (16 * Math.PI)) * s2 * ct * Math.cos(2 * phi)
      if (type === 'x(x2-3y2)') return Math.sqrt(35 / (32 * Math.PI)) * s2 * st * (Math.cos(phi) * Math.cos(2 * phi) - Math.sin(phi) * Math.sin(2 * phi))
      if (type === 'y(3x2-y2)') return Math.sqrt(35 / (32 * Math.PI)) * s2 * st * (Math.sin(phi) * Math.cos(2 * phi) + Math.cos(phi) * Math.sin(2 * phi))
    }
  }
  const absM = Math.abs(m)
  const Plm = associatedLegendre(l, absM, ct)
  const norm = Math.sqrt((2 * l + 1) / (4 * Math.PI) * factorial(l - absM) / factorial(l + absM))
  if (m === 0) return norm * Plm
  return m > 0 ? norm * Plm * Math.cos(m * phi) * Math.sqrt(2) : norm * Plm * Math.sin(absM * phi) * Math.sqrt(2)
}

// ===== Full orbital list (1s ~ 7p) =====

interface OrbitalDef {
  value: string; label: string; n: number; l: number; m: number; type?: string
  color1: string; color2: string
}

const orbitals: OrbitalDef[] = [
  { value: '1s', label: '1s', n: 1, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '2s', label: '2s', n: 2, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '2p_x', label: '2p_x', n: 2, l: 1, m: 1, type: 'x', color1: '#ff6b6b', color2: '#4ecdc4' },
  { value: '2p_y', label: '2p_y', n: 2, l: 1, m: 1, type: 'y', color1: '#ffe66d', color2: '#a8e6cf' },
  { value: '2p_z', label: '2p_z', n: 2, l: 1, m: 0, type: 'z', color1: '#ff6b9d', color2: '#c44569' },
  { value: '3s', label: '3s', n: 3, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '3p_x', label: '3p_x', n: 3, l: 1, m: 1, type: 'x', color1: '#ff6b6b', color2: '#4ecdc4' },
  { value: '3p_y', label: '3p_y', n: 3, l: 1, m: 1, type: 'y', color1: '#ffe66d', color2: '#a8e6cf' },
  { value: '3p_z', label: '3p_z', n: 3, l: 1, m: 0, type: 'z', color1: '#ff6b9d', color2: '#c44569' },
  { value: '3d_xy', label: '3d_xy', n: 3, l: 2, m: 2, type: 'xy', color1: '#ffa502', color2: '#ff6348' },
  { value: '3d_xz', label: '3d_xz', n: 3, l: 2, m: 1, type: 'xz', color1: '#1e90ff', color2: '#ff1493' },
  { value: '3d_yz', label: '3d_yz', n: 3, l: 2, m: 1, type: 'yz', color1: '#32cd32', color2: '#ff4500' },
  { value: '3d_x2-y2', label: '3d_x²-y²', n: 3, l: 2, m: 2, type: 'x2-y2', color1: '#9370db', color2: '#ffd700' },
  { value: '3d_z2', label: '3d_z²', n: 3, l: 2, m: 0, type: 'z2', color1: '#00ced1', color2: '#ff69b4' },
  { value: '4s', label: '4s', n: 4, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '4p_x', label: '4p_x', n: 4, l: 1, m: 1, type: 'x', color1: '#ff6b6b', color2: '#4ecdc4' },
  { value: '4p_y', label: '4p_y', n: 4, l: 1, m: 1, type: 'y', color1: '#ffe66d', color2: '#a8e6cf' },
  { value: '4p_z', label: '4p_z', n: 4, l: 1, m: 0, type: 'z', color1: '#ff6b9d', color2: '#c44569' },
  { value: '4d_xy', label: '4d_xy', n: 4, l: 2, m: 2, type: 'xy', color1: '#ffa502', color2: '#ff6348' },
  { value: '4d_xz', label: '4d_xz', n: 4, l: 2, m: 1, type: 'xz', color1: '#1e90ff', color2: '#ff1493' },
  { value: '4d_yz', label: '4d_yz', n: 4, l: 2, m: 1, type: 'yz', color1: '#32cd32', color2: '#ff4500' },
  { value: '4d_x2-y2', label: '4d_x²-y²', n: 4, l: 2, m: 2, type: 'x2-y2', color1: '#9370db', color2: '#ffd700' },
  { value: '4d_z2', label: '4d_z²', n: 4, l: 2, m: 0, type: 'z2', color1: '#00ced1', color2: '#ff69b4' },
  { value: '4f_z3', label: '4f_z³', n: 4, l: 3, m: 0, type: 'z3', color1: '#ff1493', color2: '#00ced1' },
  { value: '4f_xz2', label: '4f_xz²', n: 4, l: 3, m: 1, type: 'xz2', color1: '#ff6347', color2: '#4169e1' },
  { value: '4f_yz2', label: '4f_yz²', n: 4, l: 3, m: 1, type: 'yz2', color1: '#ffa500', color2: '#9370db' },
  { value: '4f_xyz', label: '4f_xyz', n: 4, l: 3, m: 1, type: 'xyz', color1: '#32cd32', color2: '#ff4500' },
  { value: '4f_z(x2-y2)', label: '4f_z(x²-y²)', n: 4, l: 3, m: 2, type: 'z(x2-y2)', color1: '#1e90ff', color2: '#ff1493' },
  { value: '4f_x(x2-3y2)', label: '4f_x(x²-3y²)', n: 4, l: 3, m: 3, type: 'x(x2-3y2)', color1: '#ff00ff', color2: '#00ffff' },
  { value: '4f_y(3x2-y2)', label: '4f_y(3x²-y²)', n: 4, l: 3, m: 3, type: 'y(3x2-y2)', color1: '#ffff00', color2: '#0000ff' },
  { value: '5s', label: '5s', n: 5, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '5p_x', label: '5p_x', n: 5, l: 1, m: 1, type: 'x', color1: '#ff6b6b', color2: '#4ecdc4' },
  { value: '5p_y', label: '5p_y', n: 5, l: 1, m: 1, type: 'y', color1: '#ffe66d', color2: '#a8e6cf' },
  { value: '5p_z', label: '5p_z', n: 5, l: 1, m: 0, type: 'z', color1: '#ff6b9d', color2: '#c44569' },
  { value: '5d_xy', label: '5d_xy', n: 5, l: 2, m: 2, type: 'xy', color1: '#ffa502', color2: '#ff6348' },
  { value: '5d_xz', label: '5d_xz', n: 5, l: 2, m: 1, type: 'xz', color1: '#1e90ff', color2: '#ff1493' },
  { value: '5d_yz', label: '5d_yz', n: 5, l: 2, m: 1, type: 'yz', color1: '#32cd32', color2: '#ff4500' },
  { value: '5d_x2-y2', label: '5d_x²-y²', n: 5, l: 2, m: 2, type: 'x2-y2', color1: '#9370db', color2: '#ffd700' },
  { value: '5d_z2', label: '5d_z²', n: 5, l: 2, m: 0, type: 'z2', color1: '#00ced1', color2: '#ff69b4' },
  { value: '5f_z3', label: '5f_z³', n: 5, l: 3, m: 0, type: 'z3', color1: '#ff1493', color2: '#00ced1' },
  { value: '5f_xz2', label: '5f_xz²', n: 5, l: 3, m: 1, type: 'xz2', color1: '#ff6347', color2: '#4169e1' },
  { value: '5f_yz2', label: '5f_yz²', n: 5, l: 3, m: 1, type: 'yz2', color1: '#ffa500', color2: '#9370db' },
  { value: '5f_xyz', label: '5f_xyz', n: 5, l: 3, m: 1, type: 'xyz', color1: '#32cd32', color2: '#ff4500' },
  { value: '5f_z(x2-y2)', label: '5f_z(x²-y²)', n: 5, l: 3, m: 2, type: 'z(x2-y2)', color1: '#1e90ff', color2: '#ff1493' },
  { value: '5f_x(x2-3y2)', label: '5f_x(x²-3y²)', n: 5, l: 3, m: 3, type: 'x(x2-3y2)', color1: '#ff00ff', color2: '#00ffff' },
  { value: '5f_y(3x2-y2)', label: '5f_y(3x²-y²)', n: 5, l: 3, m: 3, type: 'y(3x2-y2)', color1: '#ffff00', color2: '#0000ff' },
  { value: '6s', label: '6s', n: 6, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '6p_x', label: '6p_x', n: 6, l: 1, m: 1, type: 'x', color1: '#ff6b6b', color2: '#4ecdc4' },
  { value: '6p_y', label: '6p_y', n: 6, l: 1, m: 1, type: 'y', color1: '#ffe66d', color2: '#a8e6cf' },
  { value: '6p_z', label: '6p_z', n: 6, l: 1, m: 0, type: 'z', color1: '#ff6b9d', color2: '#c44569' },
  { value: '6d_xy', label: '6d_xy', n: 6, l: 2, m: 2, type: 'xy', color1: '#ffa502', color2: '#ff6348' },
  { value: '6d_xz', label: '6d_xz', n: 6, l: 2, m: 1, type: 'xz', color1: '#1e90ff', color2: '#ff1493' },
  { value: '6d_yz', label: '6d_yz', n: 6, l: 2, m: 1, type: 'yz', color1: '#32cd32', color2: '#ff4500' },
  { value: '6d_x2-y2', label: '6d_x²-y²', n: 6, l: 2, m: 2, type: 'x2-y2', color1: '#9370db', color2: '#ffd700' },
  { value: '6d_z2', label: '6d_z²', n: 6, l: 2, m: 0, type: 'z2', color1: '#00ced1', color2: '#ff69b4' },
  { value: '7s', label: '7s', n: 7, l: 0, m: 0, color1: '#00ffff', color2: '#ff00ff' },
  { value: '7p_x', label: '7p_x', n: 7, l: 1, m: 1, type: 'x', color1: '#ff6b6b', color2: '#4ecdc4' },
  { value: '7p_y', label: '7p_y', n: 7, l: 1, m: 1, type: 'y', color1: '#ffe66d', color2: '#a8e6cf' },
  { value: '7p_z', label: '7p_z', n: 7, l: 1, m: 0, type: 'z', color1: '#ff6b9d', color2: '#c44569' },
]

// ===== Create text sprite for axis labels =====

function createTextSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 128
  canvas.height = 128
  ctx.clearRect(0, 0, 128, 128)
  ctx.font = 'Bold 80px Arial'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.5, 1.5, 1)
  return sprite
}

// ===== Create glow texture =====

function createGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.4)')
  gradient.addColorStop(0.9, 'rgba(255,255,255,0.1)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

// ===== Engine state =====

interface EngineState {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  animId: number
  particleSystem: THREE.Points | null
}

// ===== Shared styles (matching design spec) =====

const labelStyle: React.CSSProperties = {
  fontFamily: 'Manrope, sans-serif',
  fontSize: 12,
  color: '#1b1c1a',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const sliderStyle: React.CSSProperties = {
  WebkitAppearance: 'none' as any,
  appearance: 'none' as any,
  width: '100%',
  height: 4,
  borderRadius: 2,
  background: 'rgba(24, 37, 68, 0.1)',
  outline: 'none',
  cursor: 'pointer',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: '#ffffff',
  borderRadius: 8,
  border: 'none',
  outline: 'none',
  color: '#1b1c1a',
  fontSize: 13,
  fontFamily: 'Manrope, sans-serif',
  cursor: 'pointer',
  boxShadow: '0px 1px 3px rgba(27, 28, 26, 0.08)',
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 10px',
  background: '#f8fafc',
  borderRadius: 6,
  fontSize: 12,
}

// ===== Component =====

export default function OrbitalViewer({ node }: { node: A2UINode }) {
  const props = node.properties ?? {}
  const orbitalType = parseStr(props.orbital, '2p_z')
  const particleCountProp = parseNum(props.particleCount, 50000)

  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<EngineState | null>(null)

  const [engineReady, setEngineReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOrbital, setSelectedOrbital] = useState(orbitalType)
  const [orbitalInfo, setOrbitalInfo] = useState<{
    name: string; n: number; l: number; m: number;
    radialNodes: number; angularNodes: number; totalNodes: number;
    shellName: string; subshellName: string;
  } | null>(null)
  const [infoCollapsed, setInfoCollapsed] = useState(true)

  const [particleCount, setParticleCount] = useState(particleCountProp)
  const [particleSize, setParticleSize] = useState(0.06)
  const [particleOpacity, setParticleOpacity] = useState(0.6)
  const [glowIntensity, setGlowIntensity] = useState(1.5)

  // Init Three.js scene
  useEffect(() => {
    const container = containerRef.current
    if (!container || engineRef.current) return

    const W = container.clientWidth, H = container.clientHeight
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 50)

    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 1000)
    camera.position.set(0, 0, 15)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = false

    scene.add(new THREE.AmbientLight(0xffffff, 0.3))
    const pointLight = new THREE.PointLight(0xffffff, 1, 100)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    // Nucleus
    const atomGeo = new THREE.SphereGeometry(0.3, 32, 32)
    const atomMat = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x444444, shininess: 100 })
    scene.add(new THREE.Mesh(atomGeo, atomMat))

    // Axes
    const axisLen = 10, axisR = 0.01
    const makeAxis = (color: number, rx: number, ry: number) => {
      const geo = new THREE.CylinderGeometry(axisR, axisR, axisLen, 8)
      const mat = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(geo, mat)
      if (rx) mesh.rotation.x = rx
      if (ry) mesh.rotation.z = ry
      scene.add(mesh)
    }
    makeAxis(0xff0000, 0, Math.PI / 2)
    makeAxis(0x00ff00, 0, 0)
    makeAxis(0x0000ff, Math.PI / 2, 0)

    // Axis labels
    const xLabel = createTextSprite('X', '#ff0000')
    xLabel.position.set(axisLen / 2 + 1, 0, 0)
    scene.add(xLabel)
    const yLabel = createTextSprite('Y', '#00ff00')
    yLabel.position.set(0, axisLen / 2 + 1, 0)
    scene.add(yLabel)
    const zLabel = createTextSprite('Z', '#0000ff')
    zLabel.position.set(0, 0, axisLen / 2 + 1)
    scene.add(zLabel)

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth, h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(container)

    let animId = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animId = requestAnimationFrame(animate)

    engineRef.current = { scene, camera, renderer, controls, animId, particleSystem: null }
    setEngineReady(true)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      engineRef.current = null
    }
  }, [])

  // Generate orbital particles
  const generateOrbital = useCallback((orbitalValue: string, count: number) => {
    const engine = engineRef.current
    if (!engine) return

    setLoading(true)
    setTimeout(() => {
      const orbital = orbitals.find(o => o.value === orbitalValue)
      if (!orbital) { setLoading(false); return }

      const { n, l, m, type, color1: c1Hex, color2: c2Hex } = orbital
      const color1 = new THREE.Color(c1Hex)
      const color2 = new THREE.Color(c2Hex)
      const Z = 1, searchRadius = 8, scaleFactor = 1.0 / n

      const radialNodes = n - l - 1
      setOrbitalInfo({
        n, l, m,
        name: orbital.label,
        radialNodes,
        angularNodes: l,
        totalNodes: radialNodes + l,
        shellName: ['K', 'L', 'M', 'N', 'O', 'P', 'Q'][n - 1] || `n=${n}`,
        subshellName: ['s', 'p', 'd', 'f', 'g', 'h'][l] || `l=${l}`,
      })

      const positions: number[] = []
      const colors: number[] = []
      const sizes: number[] = []

      let maxProb = 0
      for (let i = 0; i < 2000; i++) {
        const tr = Math.random() * searchRadius
        const tT = Math.acos(2 * Math.random() - 1)
        const tP = Math.random() * 2 * Math.PI
        const R = getRadialWavefunction(n, l, tr / scaleFactor, Z)
        const Y = getSphericalHarmonic(l, m, type, tT, tP)
        const p = R * R * Y * Y * tr * tr
        if (p > maxProb) maxProb = p
      }

      let generated = 0, attempts = 0
      while (generated < count && attempts < count * 1000) {
        attempts++
        const r = Math.random() * searchRadius
        const cosTheta = 2 * Math.random() - 1
        const theta = Math.acos(cosTheta)
        const phi = Math.random() * 2 * Math.PI
        const physicalR = r / scaleFactor
        const R = getRadialWavefunction(n, l, physicalR, Z)
        const Y = getSphericalHarmonic(l, m, type, theta, phi)
        const psi = R * Y
        const prob = psi * psi * r * r
        if (Math.random() * maxProb < prob) {
          positions.push(r * Math.sin(theta) * Math.cos(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(theta))
          const c = psi > 0 ? color1 : color2
          colors.push(c.r, c.g, c.b)
          sizes.push(0.05)
          generated++
        }
      }

      if (engine.particleSystem) {
        engine.scene.remove(engine.particleSystem)
        engine.particleSystem.geometry.dispose()
        ;(engine.particleSystem.material as THREE.PointsMaterial).dispose()
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

      const mat = new THREE.PointsMaterial({
        size: particleSizeRef.current,
        vertexColors: true,
        transparent: true,
        opacity: particleOpacityRef.current * (glowIntensityRef.current / 1.5),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        map: createGlowTexture(),
      })

      const ps = new THREE.Points(geo, mat)
      engine.scene.add(ps)
      engine.particleSystem = ps

      setLoading(false)
    }, 50)
  }, [])

  // Refs for latest slider values
  const particleSizeRef = useRef(particleSize)
  const particleOpacityRef = useRef(particleOpacity)
  const glowIntensityRef = useRef(glowIntensity)
  particleSizeRef.current = particleSize
  particleOpacityRef.current = particleOpacity
  glowIntensityRef.current = glowIntensity

  useEffect(() => {
    const ps = engineRef.current?.particleSystem
    if (!ps) return
    const mat = ps.material as THREE.PointsMaterial
    mat.size = particleSize
    mat.opacity = particleOpacity * (glowIntensity / 1.5)
  }, [particleSize, particleOpacity, glowIntensity])

  useEffect(() => {
    if (engineReady && selectedOrbital) {
      generateOrbital(selectedOrbital, particleCount)
    }
  }, [selectedOrbital, engineReady, particleCount, generateOrbital])

  useEffect(() => {
    if (orbitalType && orbitalType !== selectedOrbital) setSelectedOrbital(orbitalType)
  }, [orbitalType])

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
      width: '100%',
      minWidth: 480,
    }}>
      {/* Orbital selector */}
      <select value={selectedOrbital} onChange={(e) => setSelectedOrbital(e.target.value)} style={selectStyle}>
        {orbitals.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* 3D Canvas */}
      <div style={{
        position: 'relative',
        height: 400,
        background: '#0a0a0a',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {loading && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            fontSize: 13, color: '#94a3b8', fontFamily: 'Manrope, sans-serif',
          }}>
            生成中...
          </div>
        )}

        {/* Orbital info overlay */}
        {orbitalInfo && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(250, 249, 245, 0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            padding: infoCollapsed ? '8px 12px' : 12,
            minWidth: infoCollapsed ? 'auto' : 200,
            boxShadow: '0px 4px 12px rgba(27, 28, 26, 0.08)',
            zIndex: 10,
          }}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', userSelect: 'none', gap: 8,
              }}
              onClick={() => setInfoCollapsed(!infoCollapsed)}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#182544' }}>
                {orbitalInfo.name}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{infoCollapsed ? '▼' : '▲'}</span>
            </div>
            {!infoCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {[
                  ['能层', `${orbitalInfo.shellName} (n=${orbitalInfo.n})`],
                  ['能级', `${orbitalInfo.subshellName} (l=${orbitalInfo.l})`],
                  ['磁量子数', `m=${orbitalInfo.m}`],
                  ['径向节点', String(orbitalInfo.radialNodes)],
                  ['角节点', String(orbitalInfo.angularNodes)],
                  ['总节点数', String(orbitalInfo.totalNodes)],
                ].map(([label, value]) => (
                  <div key={label} style={infoRowStyle}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
                    <span style={{
                      color: '#1e293b', fontFamily: 'monospace', fontWeight: 500,
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interaction hint */}
        <div style={{
          position: 'absolute', bottom: 8, right: 12,
          fontSize: 11, color: '#64748b', pointerEvents: 'none',
          fontFamily: 'Manrope, sans-serif',
        }}>
          拖动旋转 / 滚轮缩放
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={labelStyle}>
          <span style={{ minWidth: 70 }}>粒子数量</span>
          <input type="range" min={10000} max={100000} step={5000} value={particleCount}
            onChange={e => setParticleCount(Number(e.target.value))} style={sliderStyle} />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)', fontSize: 12 }}>
            {particleCount}
          </span>
        </div>
        <div style={labelStyle}>
          <span style={{ minWidth: 70 }}>粒子大小</span>
          <input type="range" min={0.01} max={0.2} step={0.01} value={particleSize}
            onChange={e => setParticleSize(Number(e.target.value))} style={sliderStyle} />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)', fontSize: 12 }}>
            {particleSize.toFixed(2)}
          </span>
        </div>
        <div style={labelStyle}>
          <span style={{ minWidth: 70 }}>粒子透明度</span>
          <input type="range" min={0.1} max={1.0} step={0.05} value={particleOpacity}
            onChange={e => setParticleOpacity(Number(e.target.value))} style={sliderStyle} />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)', fontSize: 12 }}>
            {particleOpacity.toFixed(2)}
          </span>
        </div>
        <div style={labelStyle}>
          <span style={{ minWidth: 70 }}>发光强度</span>
          <input type="range" min={0.5} max={3.0} step={0.1} value={glowIntensity}
            onChange={e => setGlowIntensity(Number(e.target.value))} style={sliderStyle} />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)', fontSize: 12 }}>
            {glowIntensity.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  )
}
