import { useRef, useState } from 'react'

// A "slide all the way right to verify" captcha whose handle runs BACKWARDS:
// drag right and it goes left. If it ever nears the finish line it "resets for
// your protection," so it can never complete. Pure sabotage, fully isolated
// behind the REVERSE_SLIDER key — drop it on any round, or don't. Pointer
// events keep it touch-friendly on mobile even while it fights you.
export default function SliderCaptcha() {
  const trackRef = useRef(null)
  const [pos, setPos] = useState(0) // 0 = left, 1 = right (the unreachable goal)
  const [dragging, setDragging] = useState(false)
  const [note, setNote] = useState(null)

  function fracFrom(e) {
    const r = trackRef.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  }
  function move(e) {
    if (!dragging) return
    const reversed = 1 - fracFrom(e) // mirror the pointer: right -> left
    if (reversed > 0.85) {
      setPos(0)
      setNote('reset for your protection')
      setTimeout(() => setNote(null), 1400)
      return
    }
    setPos(reversed)
  }
  function down(e) {
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setPos(1 - fracFrom(e) > 0.85 ? 0 : 1 - fracFrom(e))
  }
  function up() { setDragging(false) }

  return (
    <div className="rslider">
      <div className="rslider__label">
        Slide all the way right to verify. <em>(Verification runs left.)</em>
      </div>
      <div
        className="rslider__track"
        ref={trackRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
      >
        <div className="rslider__fill" style={{ width: `${pos * 100}%` }} />
        <div className="rslider__goal" aria-hidden>✓</div>
        <div className="rslider__handle" style={{ left: `${pos * 100}%` }} aria-hidden>⇄</div>
      </div>
      <div className="rslider__pct">
        {Math.round(pos * 100)}% verified{note ? ` · ${note}` : ''}
      </div>
    </div>
  )
}
