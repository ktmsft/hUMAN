// Tiny WebAudio blip engine. No asset files. MUTED BY DEFAULT — the UI must opt
// in. Everything is synthesized so the bundle stays asset-free and offline.

let ctx = null
let muted = true

export function setMuted(v) { muted = v }
export function isMuted() { return muted }

function ac() {
  if (muted) return null
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function blip(freq, dur = 0.12, type = 'square', gain = 0.05) {
  const a = ac()
  if (!a) return
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g); g.connect(a.destination)
  const t = a.currentTime
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t); osc.stop(t + dur)
}

// A descending "denied" motif — the sound of not being trusted.
export function playDenied() {
  blip(320, 0.1, 'square')
  setTimeout(() => blip(220, 0.16, 'sawtooth'), 90)
}
// A neutral click for selection.
export function playTick() { blip(680, 0.04, 'square', 0.03) }
// A hollow fanfare for the robot certificate.
export function playCertificate() {
  ;[523, 494, 440, 392].forEach((f, i) => setTimeout(() => blip(f, 0.18, 'triangle', 0.06), i * 140))
}
