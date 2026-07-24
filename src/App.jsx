import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CaptchaFrame from './components/CaptchaFrame.jsx'
import Grid from './components/Grid.jsx'
import CanvasScene from './components/CanvasScene.jsx'
import TextChallenge from './components/TextChallenge.jsx'
import EndCard from './components/EndCard.jsx'
import { getRound, evaluate, chromeFor, difficultyLabel, TOTAL_AUTHORED } from './game/engine.js'
import { setMuted, isMuted, playDenied } from './game/sound.js'

// Dev round-jumper only in `npm run dev`; stripped from production builds.
const SHOW_DEV = import.meta.env.DEV

export default function App() {
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [botProb, setBotProb] = useState(38) // starts suspicious, only ever rises
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)
  const [ended, setEnded] = useState(false)
  const [muted, setMutedState] = useState(isMuted())
  const selectionRef = useRef(null)

  const round = useMemo(() => getRound(index), [index])
  const chrome = useMemo(() => chromeFor(index), [index])
  const onChange = useCallback((sel) => (selectionRef.current = sel), [])

  function toggleMute() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  function handleVerify() {
    if (busy) return
    setBusy(true)
    const result = evaluate(round, selectionRef.current)
    playDenied()
    setBotProb((p) => Math.min(99.9, +(p + 5 + Math.random() * 5).toFixed(1)))
    setToast(result.message)
    setTimeout(() => {
      setToast(null)
      setBusy(false)
      if (round.final) setEnded(true) // reached the certificate
      else setIndex((i) => i + 1)
    }, 1700)
  }

  function restart() {
    setEnded(false); setIndex(0); setBotProb(38)
  }
  function continueEndless() {
    setEnded(false); setIndex((i) => i + 1)
  }

  if (!started) {
    return (
      <div className="app">
        <Landing onBegin={() => setStarted(true)} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🤖 hCROSSWALK™</span>
        <div className="topbar__right">
          <button className="mute" onClick={toggleMute} title="Toggle sound">
            {muted ? '🔇' : '🔊'}
          </button>
          <span className="tag">{difficultyLabel(index)}</span>
        </div>
      </header>

      <main className="stage">
        <div className="round-label">
          Challenge #{index + 1}
          {index >= TOTAL_AUTHORED && <em> · procedurally generated to spite you</em>}
        </div>

        {/* key={index} remounts the frame so the enter transition replays */}
        <div className="frame-enter" key={index}>
          <CaptchaFrame round={round} chrome={chrome} botProbability={botProb} onVerify={handleVerify}>
            {round.kind === 'emoji-grid' && <Grid round={round} onChange={onChange} />}
            {round.kind === 'canvas-scene' && <CanvasScene round={round} onChange={onChange} />}
            {round.kind === 'text-challenge' && <TextChallenge round={round} onChange={onChange} />}
          </CaptchaFrame>
        </div>

        <p className="fineprint">
          By continuing you agree that you will never prove you are human.
        </p>
      </main>

      {toast && <div className="toast">{toast}</div>}

      {ended && (
        <EndCard
          roundsSurvived={index + 1}
          botProb={botProb}
          onContinue={continueEndless}
          onRestart={restart}
        />
      )}

      {SHOW_DEV && <DevPanel index={index} setIndex={setIndex} />}
    </div>
  )
}

// Landing framing: a fake "connection check" that always clears, then hands the
// player to round 1. The only verification in the whole game that ever passes —
// and it isn't even about you.
function Landing({ onBegin }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="landing">
      <div className="landing__card">
        <div className={'landing__spin' + (ready ? ' is-done' : '')} aria-hidden />
        <div className="landing__status">
          {ready ? 'Connection verified ✓' : 'Verifying your connection…'}
        </div>
        <p className="landing__sub">
          {ready
            ? 'Your network looks human enough. You, we are less certain about.'
            : 'Confirming you are a real visitor, on a real device, in a real world.'}
        </p>
        <div className={'landing__bar' + (ready ? ' is-done' : '')}><span /></div>
        {ready && (
          <button className="verify landing__go" onClick={onBegin}>Begin verification →</button>
        )}
        <p className="landing__foot">hCROSSWALK™ · nothing you do here is stored or sent</p>
      </div>
    </div>
  )
}

function DevPanel({ index, setIndex }) {
  return (
    <div className="dev">
      <span className="dev__label">dev</span>
      <button onClick={() => setIndex((i) => Math.max(0, i - 1))}>◀ prev</button>
      <span className="dev__num">round {index + 1}</span>
      <button onClick={() => setIndex((i) => i + 1)}>next ▶</button>
      <button onClick={() => setIndex(0)}>reset</button>
    </div>
  )
}
