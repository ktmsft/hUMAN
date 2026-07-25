import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CaptchaFrame from './components/CaptchaFrame.jsx'
import ImageGrid from './components/ImageGrid.jsx'
import Grid from './components/Grid.jsx'
import CanvasScene from './components/CanvasScene.jsx'
import TextChallenge from './components/TextChallenge.jsx'
import EndCard from './components/EndCard.jsx'
import {
  generateChallenge, evaluate, steal, gradMessage, RECLASSIFY,
  getAbsurd, chromeFor, difficultyLabel, ABSURD_COUNT,
  TIERS, tierAt, TIER_COUNT, TIER_V, RIG_LIMIT,
} from './game/engine.js'
import { setMuted, isMuted, playDenied } from './game/sound.js'

// Dev tier-jumper only in `npm run dev`; stripped from production builds.
const SHOW_DEV = import.meta.env.DEV
const TARGET = 3 // "3 in a row" to graduate a tier

export default function App() {
  const [started, setStarted] = useState(false)
  const [tierIndex, setTierIndex] = useState(0)
  const [streak, setStreak] = useState(0)
  const [stealCount, setStealCount] = useState(0)
  const [nonce, setNonce] = useState(0)
  const [round, setRound] = useState(() => generateChallenge(0))
  const [absurdIndex, setAbsurdIndex] = useState(-1) // -1 = still in the tiers
  const [faced, setFaced] = useState(0)              // challenges answered, for the certificate
  const [botProb, setBotProb] = useState(38)         // starts suspicious, only ever rises
  const [toast, setToast] = useState(null)           // { msg, kind }
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ended, setEnded] = useState(false)
  const [muted, setMutedState] = useState(isMuted())
  const liveRef = useRef({ selected: new Set(), live: [] })

  const inAbsurd = absurdIndex >= 0
  // ImageGrid reports { selected, live }; the older grids report a bare selection.
  const onImageChange = useCallback((p) => { liveRef.current = p }, [])
  const onGenericChange = useCallback((sel) => { liveRef.current = { selected: sel, live: [] } }, [])

  const bump = (n) => setBotProb((p) => Math.min(99.9, +(p + n).toFixed(1)))
  const toggleMute = () => { const v = !muted; setMuted(v); setMutedState(v) }
  const newRound = (t) => { setRound(generateChallenge(t)); setNonce((n) => n + 1) }
  const enterAbsurd = (i) => { setAbsurdIndex(i); setRound(getAbsurd(i)); setNonce((n) => n + 1) }

  function handleVerify() {
    if (busy) return
    setBusy(true)
    setFaced((f) => f + 1)
    playDenied()

    // ---- Tier V (absurd tail): always advances, ends at the certificate ----
    if (inAbsurd) {
      const r = round
      setToast({ msg: r.verdict, kind: 'fail' }); bump(6)
      setTimeout(() => {
        setToast(null); setBusy(false)
        if (r.final) { setEnded(true); return }
        enterAbsurd(absurdIndex + 1)
      }, 1700)
      return
    }

    // ---- Tiers I–IV: REAL evaluation ----
    const { selected, live } = liveRef.current
    const res = evaluate(round, selected, live)
    const tier = tierAt(tierIndex)

    // The wall: the rigged tier steals the clinching win. After RIG_LIMIT thefts
    // it stops arguing and reclassifies you into Tier V.
    if (tier.rigged && res.passed && streak >= TARGET - 1) {
      const s = steal(stealCount)
      setFlash(true); setToast({ msg: s.message, kind: 'steal' }); bump(7)
      setTimeout(() => {
        setFlash(false); setToast(null); setBusy(false)
        const sc = stealCount + 1
        setStealCount(sc); setStreak(0)
        if (sc >= RIG_LIMIT) { // give up on the human → Tier V
          setToast({ msg: RECLASSIFY.message, kind: 'steal' })
          setTimeout(() => { setToast(null); enterAbsurd(0) }, 2600)
        } else newRound(tierIndex)
      }, 2100)
      return
    }

    if (res.passed) {
      const ns = streak + 1
      if (ns >= TARGET) { // GRADUATE a winnable tier
        bump(1)
        setToast({ msg: gradMessage(tierIndex), kind: 'pass' })
        setTimeout(() => {
          setToast(null); setBusy(false); setStreak(0)
          const nt = tierIndex + 1
          setTierIndex(nt); newRound(nt)
        }, 2000)
      } else {
        setStreak(ns); bump(2)
        setToast({ msg: `Correct. ${ns} of ${TARGET}. Keep the streak alive…`, kind: 'pass' })
        setTimeout(() => { setToast(null); setBusy(false); newRound(tierIndex) }, 1250)
      }
      return
    }

    // honest miss — reveal the rule so it stays fair
    setStreak(0); bump(3)
    const why = res.wrong > 0 ? 'You selected something that didn’t qualify.' : 'You missed one.'
    setToast({ msg: `Not quite. ${why} ${round.hint} Streak reset.`, kind: 'fail' })
    setTimeout(() => { setToast(null); setBusy(false); newRound(tierIndex) }, 2100)
  }

  function restart() {
    setEnded(false); setAbsurdIndex(-1); setTierIndex(0); setStreak(0)
    setStealCount(0); setBotProb(38); setFaced(0); newRound(0)
  }
  const continueEndless = () => { setEnded(false); enterAbsurd(absurdIndex + 1) }

  const tier = tierAt(tierIndex)
  const chrome = useMemo(
    () => chromeFor({ inAbsurd, tierIndex, absurdIndex: Math.max(0, absurdIndex) }),
    [inAbsurd, tierIndex, absurdIndex],
  )
  const label = inAbsurd
    ? `Tier ${TIER_V.roman} · ${difficultyLabel(absurdIndex)}`
    : `Tier ${tier.roman} — ${tier.name}`
  const frameRound = useMemo(() => decorate(round, inAbsurd), [round, inAbsurd])

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
        <span className="brand">🤖 hUMAN™</span>
        <div className="topbar__right">
          <button className="mute" onClick={toggleMute} title="Toggle sound">{muted ? '🔇' : '🔊'}</button>
          <span className="tag">{label}</span>
        </div>
      </header>

      <main className="stage">
        <TierLadder tierIndex={tierIndex} inAbsurd={inAbsurd} />
        {!inAbsurd
          ? <StreakHud streak={streak} target={TARGET} />
          : <div className="hud">
              <span className="hud__label">Challenge</span>
              <span className="hud__count">#{absurdIndex + 1}</span>
              <span className="hud__stage">
                {absurdIndex >= ABSURD_COUNT ? 'procedurally generated to spite you' : 'no verified human has seen this'}
              </span>
            </div>}

        {/* key={nonce} remounts the frame so the enter transition replays */}
        <div className="frame-enter" key={nonce}>
          <CaptchaFrame round={frameRound} chrome={chrome} botProbability={botProb} onVerify={handleVerify}>
            {round.kind === 'image-grid' && <ImageGrid round={round} flash={flash} onChange={onImageChange} />}
            {round.kind === 'emoji-grid' && <Grid round={round} onChange={onGenericChange} />}
            {round.kind === 'canvas-scene' && <CanvasScene round={round} onChange={onGenericChange} />}
            {round.kind === 'text-challenge' && <TextChallenge round={round} onChange={onGenericChange} />}
          </CaptchaFrame>
        </div>

        <p className="fineprint">By continuing you agree that you will never prove you are human.</p>
      </main>

      {toast && <div className={'toast toast--' + toast.kind}>{toast.msg}</div>}

      {ended && <EndCard roundsSurvived={faced} botProb={botProb} onContinue={continueEndless} onRestart={restart} />}

      {SHOW_DEV && <DevPanel tierIndex={tierIndex} streak={streak} setStreak={setStreak}
        jump={(t) => { setAbsurdIndex(-1); setStealCount(0); setStreak(0); setTierIndex(t); newRound(t) }}
        toAbsurd={() => enterAbsurd(0)} />}
    </div>
  )
}

// Tier rounds carry no sabotage of their own — they are meant to be fair — but
// the frame still wants a `sub` line and a sabotage array to read.
function decorate(round, inAbsurd) {
  if (inAbsurd) return round
  return { ...round, sub: round.sub ?? `Clear ${TARGET} in a row to advance.`, sabotage: round.sabotage ?? [] }
}

// Landing framing: a fake "connection check" that always clears, then hands the
// player to Tier I. The only verification in the whole game that ever passes —
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
        <p className="landing__foot">hUMAN™ · nothing you do here is stored or sent</p>
      </div>
    </div>
  )
}

// I  II  III  IV  ▮V(locked)
function TierLadder({ tierIndex, inAbsurd }) {
  return (
    <div className="ladder">
      {TIERS.map((t, i) => (
        <span key={t.id} className={'rung' + (!inAbsurd && i === tierIndex ? ' rung--now' : '') + (!inAbsurd && i < tierIndex ? ' rung--done' : '')}>
          {t.roman}
        </span>
      ))}
      <span className={'rung rung--locked' + (inAbsurd ? ' rung--now' : '')} title="No verified human has ever seen Tier V.">
        {inAbsurd ? 'V' : '🔒'}
      </span>
    </div>
  )
}

function StreakHud({ streak, target }) {
  return (
    <div className="hud">
      <span className="hud__label">Streak</span>
      <span className="hud__dots">
        {Array.from({ length: target }).map((_, i) => (
          <span key={i} className={'dot' + (i < streak ? ' dot--on' : '')} />
        ))}
      </span>
      <span className="hud__count">{streak} of {target}</span>
    </div>
  )
}

function DevPanel({ tierIndex, streak, setStreak, jump, toAbsurd }) {
  return (
    <div className="dev">
      <span className="dev__label">dev</span>
      <button onClick={() => jump(Math.max(0, tierIndex - 1))}>◀ tier</button>
      <span className="dev__num">T{tierIndex + 1}</span>
      <button onClick={() => jump(Math.min(TIER_COUNT - 1, tierIndex + 1))}>tier ▶</button>
      <button onClick={() => setStreak(streak >= 2 ? 0 : streak + 1)}>+streak ({streak})</button>
      <button onClick={toAbsurd}>tier V</button>
    </div>
  )
}
