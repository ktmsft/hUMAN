import { useEffect, useState } from 'react'
import { playCertificate } from '../game/sound.js'

// The "reward" for reaching the end of the authored arc: an official-looking
// certificate declaring you a robot. Screenshot-friendly; includes a copy-taunt,
// native share, and a downloadable PNG rendered on <canvas> (no dependencies —
// stays offline and asset-free). From here you may restart or "continue anyway"
// into the endless procedural rounds.
export default function EndCard({ roundsSurvived, botProb, onContinue, onRestart }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => { playCertificate() }, [])

  const serial = 'BOT-' + String(1000 + roundsSurvived * 37).slice(-4) + '-' + String(botProb).replace('.', '')
  const taunt = `I spent ${roundsSurvived} rounds trying to prove I'm human to a CAPTCHA and it officially certified me as a robot (serial ${serial}). I have never been more seen.`

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'I am a certified robot', text: taunt })
      else throw new Error('no share')
    } catch {
      try { await navigator.clipboard.writeText(taunt); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
    }
  }

  function downloadPng() {
    const url = renderCertificatePng({ roundsSurvived, botProb, serial })
    const a = document.createElement('a')
    a.href = url
    a.download = `hcrosswalk-certificate-${serial}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="endcard-scrim">
      <div className="endcard">
        <div className="endcard__seal">🤖</div>
        <div className="endcard__kicker">CERTIFICATE OF VERIFICATION</div>
        <h1 className="endcard__title">You are a Robot.</h1>
        <p className="endcard__body">
          After <b>{roundsSurvived}</b> challenges, hCROSSWALK™ has concluded, with
          <b> {botProb}%</b> confidence, that the entity at this keyboard is not, and
          has never been, human. This finding is final and also completely made up.
        </p>
        <div className="endcard__serial">Serial No. {serial}</div>
        <div className="endcard__row">
          <button className="verify" onClick={share}>{copied ? 'Copied!' : 'Share / copy taunt'}</button>
          <button className="ghost-btn" onClick={downloadPng}>{saved ? 'Saved ✓' : '⬇ Download PNG'}</button>
          <button className="ghost-btn" onClick={onContinue}>Continue anyway ∞</button>
          <button className="ghost-btn" onClick={onRestart}>Start over</button>
        </div>
        <p className="endcard__foot">Download it, screenshot it, frame it. It’s the only proof you’ll get of anything.</p>
      </div>
    </div>
  )
}

// Draw the certificate onto an offscreen canvas and return a PNG data URL. Pure
// canvas so the bundle stays dependency-free and works offline / from file://.
function renderCertificatePng({ roundsSurvived, botProb, serial }) {
  const W = 900, H = 620, scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  // paper + gold border
  ctx.fillStyle = '#fbfcfe'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#d8b24a'; ctx.lineWidth = 6
  ctx.strokeRect(18, 18, W - 36, H - 36)
  ctx.strokeStyle = '#e6cf8f'; ctx.lineWidth = 1
  ctx.strokeRect(30, 30, W - 60, H - 60)

  ctx.textAlign = 'center'

  // seal
  ctx.font = '72px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif'
  ctx.fillText('🤖', W / 2, 130)

  // kicker
  ctx.fillStyle = '#a07c1e'
  ctx.font = '700 16px system-ui, sans-serif'
  withLetterSpacing(ctx, 6, () => ctx.fillText('CERTIFICATE OF VERIFICATION', W / 2, 178))

  // title
  ctx.fillStyle = '#1a1d23'
  ctx.font = '700 46px Georgia, "Times New Roman", serif'
  ctx.fillText('You are a Robot.', W / 2, 242)

  // body (wrapped)
  ctx.fillStyle = '#3a3f48'
  ctx.font = '19px system-ui, sans-serif'
  const body =
    `After ${roundsSurvived} challenges, hCROSSWALK™ has concluded, with ${botProb}% confidence, ` +
    `that the entity at this keyboard is not, and has never been, human. ` +
    `This finding is final and also completely made up.`
  wrapText(ctx, body, W / 2, 300, W - 180, 28)

  // serial box
  ctx.strokeStyle = '#cbd2da'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1
  ctx.strokeRect(W / 2 - 170, 452, 340, 40)
  ctx.setLineDash([])
  ctx.fillStyle = '#6b7280'
  ctx.font = '16px ui-monospace, Menlo, monospace'
  ctx.fillText(`Serial No. ${serial}`, W / 2, 478)

  // footer
  ctx.fillStyle = '#a07c1e'
  ctx.font = '700 13px system-ui, sans-serif'
  withLetterSpacing(ctx, 3, () => ctx.fillText('hCROSSWALK™ · VERIFICATION AUTHORITY', W / 2, 540))
  ctx.fillStyle = '#8a94a3'
  ctx.font = 'italic 13px system-ui, sans-serif'
  ctx.fillText('Nothing here was stored or transmitted. Not even this certificate believes in itself.', W / 2, 566)

  return canvas.toDataURL('image/png')
}

function withLetterSpacing(ctx, px, fn) {
  const had = 'letterSpacing' in ctx
  if (had) ctx.letterSpacing = `${px}px`
  fn()
  if (had) ctx.letterSpacing = '0px'
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  const lines = []
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line); line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  lines.forEach((ln, i) => ctx.fillText(ln, cx, y + i * lineHeight))
}
