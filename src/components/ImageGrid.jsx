import { useEffect, useMemo, useRef, useState } from 'react'
import { GLYPH, liveAttrs } from '../game/tiles.js'
import { pickImage } from '../game/images.manifest.js'

// The real-gameplay grid. Renders each tile as concept-accurate PLACEHOLDER art
// (swap for photoreal by giving a tile a `src`), cycles dynamic lights on a
// timer, and reports { selected, live } upward so evaluation can be timing-aware.
export default function ImageGrid({ round, flash, onChange }) {
  const [selected, setSelected] = useState(() => new Set())
  const [step, setStep] = useState(0) // drives dynamic light cycling
  const hasDynamic = useMemo(() => round.tiles.some((t) => t.dynamic), [round])

  // reset on new round
  useEffect(() => { setSelected(new Set()); setStep(0) }, [round])

  // advance dynamic lights at this tier's cadence; neighbors out of phase (step + index)
  useEffect(() => {
    if (!hasDynamic) return
    const t = setInterval(() => setStep((s) => s + 1), round.period || 1000)
    return () => clearInterval(t)
  }, [round, hasDynamic])

  // current color for a dynamic tile at this step
  function colorOf(tile, i) {
    if (!tile.dynamic) return tile.attrs.color
    const cyc = tile.dynamic.cycle
    return cyc[(step + i) % cyc.length]
  }

  // report live snapshot whenever selection or lights change
  useEffect(() => {
    const live = round.tiles.map((t, i) => liveAttrs(t, colorOf(t, i)))
    onChange?.({ selected, live })
  }, [selected, step, round, onChange])

  function toggle(i) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const style = { gridTemplateColumns: `repeat(${round.cols}, 1fr)` }

  return (
    <div className={'grid img-grid' + (flash ? ' img-grid--flash' : '')} style={style}>
      {round.tiles.map((t, i) => (
        <button
          key={i}
          className={'tile' + (selected.has(i) ? ' tile--on' : '')}
          onClick={() => toggle(i)}
          aria-pressed={selected.has(i)}
        >
          <TileArt tile={t} color={colorOf(t, i)} />
          {selected.has(i) && <span className="tile__check">✓</span>}
        </button>
      ))}
    </div>
  )
}

// Concept-accurate placeholder art. Replace with <img src={tile.src}/> when the
// generated image pack lands — attributes/rules are unchanged.
function TileArt({ tile, color }) {
  // When a generated image pack is registered in images.manifest.js this returns a
  // src and we render the real photo; otherwise we fall back to placeholder art.
  const src = tile.src ?? pickImage(tile, color)
  if (src) return <img className="art art--img" src={src} alt="" />

  if (tile.cat === 'crosswalk') {
    return (
      <div className="art art--cross">
        <div className="art__stripes" />
        {tile.attrs.signal === 'dont' && <span className="signal signal--dont">✋ DON’T WALK</span>}
        {tile.attrs.signal === 'walk' && <span className="signal signal--walk">🚶 WALK</span>}
      </div>
    )
  }
  if (tile.cat === 'light') {
    return (
      <div className="art art--light">
        <div className="lamp-housing">
          <span className={'lamp lamp--red' + (color === 'red' ? ' on' : '')} />
          <span className={'lamp lamp--yellow' + (color === 'yellow' ? ' on' : '')} />
          <span className={'lamp lamp--green' + (color === 'green' ? ' on' : '')} />
        </div>
      </div>
    )
  }
  const glyph = GLYPH[tile.attrs.kind] || '❔'
  return <div className="art art--glyph"><span>{glyph}</span></div>
}
