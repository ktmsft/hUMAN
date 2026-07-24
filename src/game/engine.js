import { ROUNDS, SABOTAGE } from './rounds.js'

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------
// The engine's one job: make sure the player never, ever passes, while making
// the *reason* they failed feel freshly insulting every time.
// ---------------------------------------------------------------------------

export const TOTAL_AUTHORED = ROUNDS.length

export function getRound(index) {
  if (index < ROUNDS.length) return ROUNDS[index]
  return makeProceduralRound(index)
}

// ---------------------------------------------------------------------------
// EVOLVING CHROME
// ---------------------------------------------------------------------------
// The widget slowly stops looking like a captcha. Act 1 is a security check;
// Act 2 mutates into a bureaucratic form; Act 3 into a terms-of-service; the
// endless procedural rounds arrive as a court summons. Purely cosmetic — the
// game underneath is identical. CaptchaFrame renders per `key` (see CSS
// .frame--{key}); everything here is data so no new components are needed.
export const CHROME = {
  captcha: {
    key: 'captcha',
    badge: 'hCROSSWALK™ · Security Check',
    docLine: null,
    verify: 'Verify',
    footnote: null,
  },
  form: {
    key: 'form',
    badge: 'Identity Form 27-B · Section 4 of ∞',
    docLine: 'Please complete all required fields. There are no fields.',
    verify: 'Submit',
    footnote: '* Incomplete forms are forwarded to Compliance (also us).',
  },
  tos: {
    key: 'tos',
    badge: 'Terms of Verification · revision 9.∞',
    docLine: 'READ CAREFULLY. Interaction constitutes agreement you cannot revoke.',
    verify: 'I Agree',
    footnote: 'By proceeding you waive any future claim to being human.',
  },
  summons: {
    key: 'summons',
    badge: 'NOTICE TO APPEAR · The Algorithm v. You',
    docLine: 'You are hereby summoned to continue verifying, in perpetuity.',
    verify: 'Acknowledge Service',
    footnote: 'Failure to respond constitutes admission of bothood.',
  },
}

// Which chrome a given round wears. Slow mutation: one variant per act, with the
// procedural tail (index >= authored) served as the summons.
export function chromeFor(index) {
  if (index >= ROUNDS.length) return CHROME.summons
  const act = ROUNDS[index]?.act || 1
  if (act >= 3) return CHROME.tos
  if (act === 2) return CHROME.form
  return CHROME.captcha
}

// Escalating "difficulty" label — purely cosmetic, purely a lie.
export function difficultyLabel(index) {
  const labels = [
    'Verification',
    'Verification (enhanced)',
    'Verification (paranoid)',
    'Verification (hostile)',
    'Verification (existential)',
    'Verification (why are you still here)',
  ]
  return labels[Math.min(index, labels.length - 1)]
}

// Given a round + the player's selection, decide what the machine says.
// It NEVER returns success. `advance` is always true so the game rolls on.
export function evaluate(round, selection) {
  return {
    passed: false,
    advance: true,
    message: round.verdict,
    // A fake, ever-rising "bot probability" for the HUD.
    botProbability: null, // App tracks/increments this; kept here for extension
  }
}

// ---------------------------------------------------------------------------
// PROCEDURAL ROUNDS  (after the authored arc, generate endless absurdity)
// ---------------------------------------------------------------------------
const IMPOSSIBLE_TARGETS = [
  'traffic lights that regret their choices',
  'buses that are secretly trains',
  'crosswalks visible only to the pure of heart',
  'squares containing the concept of Tuesday',
  'motorcycles that have read Kant',
  'fire hydrants dreaming of the sea',
]
const DECOY_POOL = ['\u{1F695}', '\u{1F68C}', '\u{1F6A6}', '\u{1F6B2}', '\u{1F6A8}', '\u{1F333}', '\u{1F3E2}', '\u{2753}']
const SABOTAGE_POOL = Object.values(SABOTAGE)

export function makeProceduralRound(index) {
  // Deterministic from index so the same round is stable if you navigate back.
  const t = IMPOSSIBLE_TARGETS[index % IMPOSSIBLE_TARGETS.length]
  const size = 3 + (index % 3) // 3..5 cols
  const total = size * size
  const cells = []
  for (let i = 0; i < total; i++) {
    cells.push({ glyph: DECOY_POOL[(i * (index + 7)) % DECOY_POOL.length], target: false })
  }
  // number of sabotages ramps with the round index (capped)
  const nSab = Math.min(SABOTAGE_POOL.length, 2 + Math.floor(index / 2))
  const sabotage = SABOTAGE_POOL.slice(0, nSab)

  return {
    id: index + 1,
    kind: 'emoji-grid',
    prompt: `Select all ${t}`,
    sub: 'This challenge was generated specifically because we do not trust you.',
    grid: { cols: size, rows: size },
    cells,
    sabotage,
    verdict: 'Wrong. Obviously. A human would have known that was wrong too, so, jury’s out.',
    solvable: false,
    procedural: true,
  }
}
