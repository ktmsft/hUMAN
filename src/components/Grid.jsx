import { useEffect, useMemo, useRef, useState } from 'react'
import { SABOTAGE } from '../game/rounds.js'

// Emoji grid with live "sabotage" behaviors. Selection state lives here and is
// reported up via onChange so the frame's Verify button can read it.
export default function Grid({ round, onChange }) {
  const has = (k) => round.sabotage?.includes(k)
  const [cells, setCells] = useState(round.cells)
  const [selected, setSelected] = useState(() => new Set())
  const [offsets, setOffsets] = useState({}) // per-tile flee offsets (DODGE)
  const [scale, setScale] = useState(1)
  const driftRef = useRef(null)
  const lagRef = useRef(null) // fake trailing cursor (CURSOR_LAG)

  // Reset when the round changes.
  useEffect(() => {
    setCells(round.cells)
    setSelected(new Set())
    setOffsets({})
    setScale(1)
  }, [round])

  // SHRINK: tiles slowly shrink the longer the player deliberates.
  useEffect(() => {
    if (!has(SABOTAGE.SHRINK)) return
    const t = setInterval(() => setScale((s) => Math.max(0.55, s - 0.03)), 600)
    return () => clearInterval(t)
  }, [round])

  // DRIFT: nudge the whole grid around with a wandering transform.
  useEffect(() => {
    if (!has(SABOTAGE.DRIFT)) return
    let raf, a = 0
    const el = driftRef.current
    const tick = () => {
      a += 0.02
      if (el) el.style.transform = `translate(${Math.sin(a) * 10}px, ${Math.cos(a * 0.7) * 8}px)`
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [round])

  // CURSOR_LAG: a decoy cursor that eases toward the real pointer, always late.
  useEffect(() => {
    if (!has(SABOTAGE.CURSOR_LAG)) return
    const wrap = driftRef.current
    let raf, tx = 0, ty = 0, x = 0, y = 0
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect()
      tx = e.clientX - r.left
      ty = e.clientY - r.top
    }
    const tick = () => {
      x += (tx - x) * 0.08 // heavy easing == laggy feel
      y += (ty - y) * 0.08
      if (lagRef.current) lagRef.current.style.transform = `translate(${x}px, ${y}px)`
      raf = requestAnimationFrame(tick)
    }
    wrap.addEventListener('pointermove', onMove)
    tick()
    return () => { wrap.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [round])

  useEffect(() => { onChange?.(selected) }, [selected, onChange])

  function toggle(i) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
    // REGENERATE: clicking morphs a different random tile.
    if (has(SABOTAGE.REGENERATE)) {
      setCells((prev) => {
        const next = prev.slice()
        const j = (i * 7 + 3) % next.length
        next[j] = { ...next[j], glyph: next[i].glyph, target: !next[j].target }
        return next
      })
    }
    // RESHUFFLE: swap two tiles so your selection drifts out of place.
    if (has(SABOTAGE.RESHUFFLE)) {
      setCells((prev) => {
        const next = prev.slice()
        const b = (i + Math.floor(next.length / 2)) % next.length
        ;[next[i], next[b]] = [next[b], next[i]]
        return next
      })
    }
  }

  // DODGE: approaching a tile shoves it away from the pointer.
  function flee(i, e) {
    if (!has(SABOTAGE.DODGE)) return
    const r = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const mag = Math.hypot(dx, dy) || 1
    const push = 26
    setOffsets((o) => ({ ...o, [i]: { x: (-dx / mag) * push, y: (-dy / mag) * push } }))
  }

  // FAKE_SELECT_ALL: the helpful shortcut that immediately betrays you.
  const [betrayed, setBetrayed] = useState(false)
  function selectAllTrap() {
    setSelected(new Set(cells.map((_, i) => i)))
    setBetrayed(true)
    setTimeout(() => setSelected(new Set()), 450) // "oops" — they all deselect
    setTimeout(() => setBetrayed(false), 1400)
  }

  const wiggle = has(SABOTAGE.WIGGLE)
  const style = useMemo(
    () => ({ gridTemplateColumns: `repeat(${round.grid.cols}, 1fr)` }),
    [round]
  )

  return (
    <div className={'grid-wrap' + (has(SABOTAGE.CURSOR_LAG) ? ' grid-wrap--nocursor' : '')} ref={driftRef}>
      {has(SABOTAGE.FAKE_SELECT_ALL) && (
        <button className="select-all" onClick={selectAllTrap}>
          {betrayed ? 'wait, no—' : '☑ Select all'}
        </button>
      )}

      <div className="grid" style={style}>
        {cells.map((c, i) => {
          const off = offsets[i] || { x: 0, y: 0 }
          return (
            <button
              key={i}
              className={'tile' + (selected.has(i) ? ' tile--on' : '') + (wiggle ? ' tile--wiggle' : '')}
              style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${scale})`, animationDelay: `${(i % 5) * 90}ms` }}
              onMouseMove={(e) => flee(i, e)}
              onClick={() => toggle(i)}
              aria-pressed={selected.has(i)}
            >
              <span className="tile__glyph">{c.glyph}</span>
              {selected.has(i) && <span className="tile__check">✓</span>}
            </button>
          )
        })}
      </div>

      {has(SABOTAGE.CURSOR_LAG) && <div className="lag-cursor" ref={lagRef} aria-hidden />}
    </div>
  )
}
