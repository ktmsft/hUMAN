import { useEffect, useState } from 'react'
import { SABOTAGE } from '../game/rounds.js'
import SliderCaptcha from './SliderCaptcha.jsx'

// The chrome around every challenge: the fake-official header, the prompt, the
// footer with Verify. Handles FADE_PROMPT and FAKE_TIMER sabotage since those
// live on the frame, not the challenge body. `chrome` (from engine.chromeFor)
// mutates the look act-by-act: captcha → form → terms-of-service → summons.
export default function CaptchaFrame({ round, chrome, botProbability, children, onVerify }) {
  const has = (k) => round.sabotage?.includes(k)
  const skin = chrome ?? { key: 'captcha', badge: 'hUMAN™ · Security Check', verify: 'Verify' }
  const [faded, setFaded] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const [btnSelected, setBtnSelected] = useState(false) // SELECT_ALL_VERIFY gag

  useEffect(() => {
    setFaded(false)
    setSeconds(30)
    setBtnSelected(false)
    if (has(SABOTAGE.FADE_PROMPT)) {
      const t = setTimeout(() => setFaded(true), 1500)
      return () => clearTimeout(t)
    }
  }, [round])

  useEffect(() => {
    if (!has(SABOTAGE.FAKE_TIMER)) return
    const t = setInterval(() => setSeconds((s) => (s <= 0 ? 30 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [round])

  return (
    <div className={'frame frame--' + skin.key}>
      <div className="frame__chrome">
        <span className="frame__badge">{skin.badge}</span>
        <span className="frame__seal" aria-hidden>
          {skin.key === 'summons' ? '⚖️' : skin.key === 'tos' ? '📜' : skin.key === 'form' ? '🗒️' : '🔒'}
        </span>
      </div>

      <div className="frame__prompt">
        <div className={'frame__prompt-text' + (faded ? ' is-faded' : '')}>
          <strong>{round.prompt}</strong>
          {round.sub && <span className="frame__sub">{round.sub}</span>}
        </div>
        {has(SABOTAGE.FAKE_TIMER) && (
          <div className="frame__timer" title="This timer is meaningless.">
            ⏱ {String(seconds).padStart(2, '0')}s
          </div>
        )}
      </div>

      {skin.docLine && <div className="frame__docline">{skin.docLine}</div>}

      {has(SABOTAGE.REVERSE_SLIDER) && <div className="frame__slider"><SliderCaptcha /></div>}

      <div className="frame__body">{children}</div>

      {skin.footnote && <div className="frame__footnote">{skin.footnote}</div>}

      <div className="frame__footer">
        <div className="frame__meta">
          <button className="ghost" title="It refreshes nothing.">⟳</button>
          <button className="ghost" title="There is no audio. There is only doubt.">🎧</button>
          <span className="frame__bot">
            bot&nbsp;probability:&nbsp;<b>{botProbability}%</b>
          </span>
        </div>
        <div className="verify-wrap">
          {has(SABOTAGE.SELECT_ALL_VERIFY) && (
            <label className="pick-all" title="This selects the button. Not the tiles. The button.">
              <input
                type="checkbox"
                checked={btnSelected}
                onChange={(e) => setBtnSelected(e.target.checked)}
              />
              Select all
            </label>
          )}
          {btnSelected && has(SABOTAGE.SELECT_ALL_VERIFY) && (
            <span className="verify-tag">☑ 1 selected: this button</span>
          )}
          <button
            className={'verify' + (btnSelected && has(SABOTAGE.SELECT_ALL_VERIFY) ? ' verify--selected' : '')}
            onClick={onVerify}
          >
            {skin.verify}
          </button>
        </div>
      </div>
    </div>
  )
}
