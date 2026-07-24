import { useEffect, useRef, useState } from 'react'
import { SABOTAGE } from '../game/rounds.js'

// "Where's Waldo" style procedural scenes drawn on <canvas>. The player clicks
// where they think crosswalks are; markers drop, but the machine never agrees on
// the count (hit detection is deliberately wrong — "verified" is always 0).
//
// Scenes escalate in density. Add a new one by adding a case to SCENES.
const SCENES = {
  intersection: { spots: 24, density: 1, tint: '#3a3f45' },
  market: { spots: 46, density: 1.6, tint: '#413a34' },
  parade: { spots: 64, density: 2.0, tint: '#37303f' },
  mirrors: { spots: 80, density: 2.4, tint: '#2a2f3a' },
  void: { spots: 128, density: 3.2, tint: '#181b22' },
}

export default function CanvasScene({ round, onChange }) {
  const canvasRef = useRef(null)
  const [marks, setMarks] = useState([])
  const has = (k) => round.sabotage?.includes(k)
  const cfg = SCENES[round.scene] ?? SCENES.intersection

  useEffect(() => setMarks([]), [round])
  useEffect(() => { onChange?.(marks) }, [marks, onChange])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = (canvas.width = 520)
    const H = (canvas.height = 340)
    let raf, drift = 0

    function draw() {
      drift += has(SABOTAGE.DRIFT) ? 0.4 : 0
      ctx.clearRect(0, 0, W, H)

      // ground
      ctx.fillStyle = cfg.tint
      ctx.fillRect(0, 0, W, H)

      // a messy web of roads / stalls, denser per scene
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 26 / cfg.density
      const gap = 90 / cfg.density
      for (let x = -40; x < W + 40; x += gap) line(ctx, x + (drift % gap), 0, x - 30 + (drift % gap), H)
      for (let y = 20; y < H; y += 70 / cfg.density) line(ctx, 0, y, W, y + 6)

      // scatter tiny crosswalk clusters (the "Waldos") + decoys
      const spots = seededSpots(round.id, cfg.spots, W, H)
      spots.forEach((s, i) => {
        const isCross = i % 3 === 0
        if (isCross) drawCrosswalk(ctx, s.x + (drift % gap), s.y, s.rot, cfg.density)
        else drawDecoy(ctx, s.x + (drift % gap), s.y, i)
      })

      // mirrors scene: ghostly reflections that look identical to the real thing
      if (round.scene === 'mirrors') {
        ctx.globalAlpha = 0.4
        spots.forEach((s, i) => drawCrosswalk(ctx, W - s.x + (drift % gap), s.y, -s.rot, cfg.density))
        ctx.globalAlpha = 1
      }

      // player markers
      marks.forEach((m) => {
        ctx.strokeStyle = '#ff4d6d'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(m.x, m.y, 13, 0, Math.PI * 2)
        ctx.stroke()
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [round, marks])

  function onClick(e) {
    const r = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 520
    const y = ((e.clientY - r.top) / r.height) * 340
    setMarks((m) => [...m, { x, y }])
  }

  return (
    <div className={'canvas-wrap' + (has(SABOTAGE.CURSOR_LAG) ? ' canvas-wrap--laggy' : '')}>
      <canvas ref={canvasRef} className="scene" onClick={onClick} />
      <div className="scene__counter">
        Found: {marks.length} / 7 · <span className="scene__verified">verified: 0</span>
      </div>
    </div>
  )
}

// --- tiny drawing helpers ---------------------------------------------------
function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
}
function drawCrosswalk(ctx, x, y, rot, density) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
  ctx.fillStyle = '#e9edf2'
  const s = 1 / density
  for (let i = 0; i < 4; i++) ctx.fillRect((i * 6 - 12) * s, -10 * s, 4 * s, 20 * s)
  ctx.restore()
}
function drawDecoy(ctx, x, y, i) {
  ctx.save(); ctx.translate(x, y)
  const kinds = ['#c94f4f', '#4f79c9', '#59a35b'] // hydrant / sign / bush blobs
  ctx.fillStyle = kinds[i % kinds.length]
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}
// deterministic pseudo-random spots so the scene is stable across frames
function seededSpots(seed, n, W, H) {
  const out = []; let s = seed * 9301 + 49297
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280; const rx = s / 233280
    s = (s * 9301 + 49297) % 233280; const ry = s / 233280
    out.push({ x: 30 + rx * (W - 60), y: 30 + ry * (H - 60), rot: (rx - 0.5) * 2 })
  }
  return out
}
