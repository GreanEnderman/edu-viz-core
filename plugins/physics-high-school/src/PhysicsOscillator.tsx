import { useEffect, useRef, useState } from 'react'

interface A2UINode {
  properties?: Record<string, unknown>
}

function parseNum(val: unknown, fallback: number): number {
  const n = Number(val)
  return Number.isFinite(n) ? n : fallback
}

export default function PhysicsOscillator({ node }: { node: A2UINode }) {
  const props = node.properties ?? {}
  const initAmp = parseNum(props.amplitude, 1)
  const initFreq = parseNum(props.freq, 1)
  const initPhase = parseNum(props.phase, 0)

  const [amplitude, setAmplitude] = useState(initAmp)
  const [freq, setFreq] = useState(initFreq)
  const [phase, setPhase] = useState(initPhase)

  // Sync when A2UI props change (e.g. new conversation message)
  useEffect(() => { setAmplitude(initAmp) }, [initAmp])
  useEffect(() => { setFreq(initFreq) }, [initFreq])
  useEffect(() => { setPhase(initPhase) }, [initPhase])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = H / 2
    const omega = 2 * Math.PI * freq
    let startTime: number | null = null

    function draw(ts: number) {
      if (!ctx) return
      if (startTime === null) startTime = ts
      const t = (ts - startTime) / 1000

      ctx.clearRect(0, 0, W, H)

      // Draw axes
      ctx.strokeStyle = 'rgba(24, 37, 68, 0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, cx)
      ctx.lineTo(W, cx)
      ctx.stroke()

      // Draw wave
      ctx.strokeStyle = '#182544'
      ctx.lineWidth = 2
      ctx.beginPath()
      const maxPixelAmp = (H / 2) * 0.8
      const displayAmp = Math.min(amplitude, 10) / 10 * maxPixelAmp

      for (let x = 0; x < W; x++) {
        const tLocal = t - x / W * 2
        const y = cx - displayAmp * Math.sin(omega * tLocal + phase)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Draw moving dot
      const dotY = cx - displayAmp * Math.sin(omega * t + phase)
      ctx.beginPath()
      ctx.arc(W * 0.1, dotY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#775a19'
      ctx.fill()

      // Labels
      ctx.fillStyle = 'rgba(24, 37, 68, 0.5)'
      ctx.font = '11px Manrope, sans-serif'
      ctx.fillText(`A = ${amplitude.toFixed(1)} m`, 8, 16)
      ctx.fillText(`f = ${freq.toFixed(1)} Hz`, 8, 30)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [amplitude, freq, phase])

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

  return (
    <div style={{ background: '#faf9f5', borderRadius: 12, padding: 12, display: 'inline-block' }}>
      <canvas ref={canvasRef} width={320} height={120} style={{ display: 'block', borderRadius: 8 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div style={labelStyle}>
          <span style={{ minWidth: 60 }}>振幅 A</span>
          <input
            type="range" min={0} max={10} step={0.1}
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
            style={sliderStyle}
          />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)' }}>{amplitude.toFixed(1)}</span>
        </div>
        <div style={labelStyle}>
          <span style={{ minWidth: 60 }}>频率 f</span>
          <input
            type="range" min={0.1} max={5} step={0.1}
            value={freq}
            onChange={(e) => setFreq(Number(e.target.value))}
            style={sliderStyle}
          />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)' }}>{freq.toFixed(1)}</span>
        </div>
        <div style={labelStyle}>
          <span style={{ minWidth: 60 }}>相位 &phi;</span>
          <input
            type="range" min={0} max={6.28} step={0.01}
            value={phase}
            onChange={(e) => setPhase(Number(e.target.value))}
            style={sliderStyle}
          />
          <span style={{ minWidth: 40, textAlign: 'right', color: 'rgba(24,37,68,0.6)' }}>{phase.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
