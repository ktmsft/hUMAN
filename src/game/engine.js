import { TIERS, tierAt, TIER_COUNT, TIER_V, RIG_LIMIT } from './tiers.js'
import { RULES, correctTile, trapTile } from './rules.js'
import { DECOY_TILES, liveAttrs } from './tiles.js'
import { ROUNDS, SABOTAGE } from './rounds.js'

export { TIERS, tierAt, TIER_COUNT, TIER_V, RIG_LIMIT, liveAttrs }

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------
// Two halves, one engine:
//   Tiers I–IV  — a REAL skill loop. Honest grids, honest evaluation, learnable
//                 rules. You genuinely graduate I, II, III. Tier IV is the wall:
//                 it steals the clinching win until it reclassifies you.
//   Tier V      — the absurd/meta/honeypot tail (rounds.js), which you only ever
//                 see because the machine decided you are not human.
// The engine's one job: let you win exactly enough to make the theft hurt.
// ---------------------------------------------------------------------------

const rint = (n) => Math.floor(Math.random() * n)
function shuffle(a) {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = rint(i + 1);[r[i], r[j]] = [r[j], r[i]] }
  return r
}

// ---------------------------------------------------------------------------
// CHALLENGE GENERATION — pick a random rule from the tier's pool, size the grid
// to the tier, scale trap density with depth, set the dynamic-light cadence.
// ---------------------------------------------------------------------------
export function generateChallenge(tierIndex) {
  const tier = tierAt(tierIndex)
  const ruleId = tier.pool[rint(tier.pool.length)]
  const rule = RULES[ruleId]
  const total = tier.cols * tier.cols

  const nCorrect = Math.max(2, Math.round(total * 0.28))
  const nTraps = Math.max(2, Math.round(total * (0.20 + tierIndex * 0.05)))
  const tiles = []
  for (let i = 0; i < nCorrect; i++) tiles.push(correctTile(rule.id, tier.dynamic))
  for (let i = 0; i < nTraps; i++) tiles.push(trapTile(rule.traps[i % rule.traps.length]))
  while (tiles.length < total) tiles.push(DECOY_TILES[tiles.length % DECOY_TILES.length])

  // apply this tier's cycling speed to any dynamic light
  if (tier.dynamic) tiles.forEach((t) => { if (t.dynamic) t.dynamic.period = tier.period })

  return {
    kind: 'image-grid',
    ruleId: rule.id,
    prompt: rule.prompt,
    hint: rule.hint,
    cols: tier.cols,
    dynamic: tier.dynamic,
    period: tier.dynamic ? tier.period : null,
    rigged: tier.rigged,
    tiles: shuffle(tiles),
    tierIndex,
  }
}

// ---------------------------------------------------------------------------
// EVALUATION — REAL, and it stays real. `live` = current tile attrs at the
// moment Verify is pressed (a dynamic light reports the color it is showing
// right then), so timing genuinely matters. Never rig this function: the comedy
// is the theft at the wall, not a dishonest grader.
// ---------------------------------------------------------------------------
export function evaluate(round, selectedSet, live) {
  const rule = RULES[round.ruleId]
  const correct = new Set()
  live.forEach((t, i) => { if (rule.test(t)) correct.add(i) })
  const sel = selectedSet ?? new Set()
  let passed = sel.size === correct.size && sel.size > 0
  if (passed) for (const i of sel) if (!correct.has(i)) { passed = false; break }
  const wrong = [...sel].filter((i) => !correct.has(i)).length
  return { passed, wrong, correctCount: correct.size }
}

// ---------------------------------------------------------------------------
// COPY — graduation (winnable tiers), the Tier IV rig, and reclassification.
// ---------------------------------------------------------------------------
export function gradMessage(clearedIndex) {
  const next = TIERS[clearedIndex + 1]
  const lines = [
    `Tier I cleared. Proceeding to Tier II. This is going well. Suspiciously well.`,
    `Tier II cleared. Proceeding to Tier III. Note: no one clears Tier III. You are “no one,” apparently.`,
    `Tier III cleared. Proceeding to Tier IV — Adversarial. Enjoy is the wrong word.`,
  ]
  return lines[clearedIndex] || `Tier cleared. Proceeding to Tier ${next ? next.roman : '—'}.`
}

// Every way Tier IV takes back a win you actually earned. Ordered: each theft is
// a little more brazen than the last, and the final one stops pretending.
const STEALS = [
  { fx: 'ruleflip',  message: 'Correct! …wait. In this region that sign means the opposite. Streak reset. You had 2 of 3.' },
  { fx: 'lightflip', message: 'One of your red lights turned green a half-second before you clicked Verify. Doesn’t count. 2 of 3.' },
  { fx: 'refresh',   message: 'Verification refreshed for your security. Your 2-of-3 progress could not be carried over. Apologies.' },
  { fx: 'quorum',    message: 'Your answer was correct, but only three of our five verifiers agreed, and one of them is on leave. Inconclusive. 2 of 3.' },
  { fx: 'goalpost',  message: 'Excellent — 3 in a row! The threshold has been updated to 4 in a row. You now have 0 of 4.' },
  { fx: 'backdated', message: 'Your streak has been reviewed and backdated to before it began. Administratively, it never happened. 2 of 3.' },
  { fx: 'existential', message: 'You cleared it. We simply do not believe you. Belief is not a setting we can change. 2 of 3.' },
]
export function steal(stealCount) { return STEALS[Math.min(stealCount, STEALS.length - 1)] }
export const STEAL_COUNT = STEALS.length

export const RECLASSIFY = {
  title: 'RECLASSIFICATION NOTICE',
  message: 'You have failed Tier IV conclusively. You are hereby reclassified as non-human. ' +
    'Granting access to Tier V — a tier no verified human has ever seen. This is not a compliment.',
}

// ---------------------------------------------------------------------------
// TIER V — the "unseen" tier = the absurd/meta/honeypot tail + certificate.
// ---------------------------------------------------------------------------
// Acts 2 and 3 of the authored arc. Act 1 is deliberately skipped: those were
// the "this seems normal" warm-ups, and tiers I–IV now do that job for real, so
// replaying them here would walk the joke backwards. After the authored tail
// runs out the procedural generator keeps it going forever.
export const ABSURD_TAIL = ROUNDS.filter((r) => r.act >= 2)
export const ABSURD_COUNT = ABSURD_TAIL.length
export const TOTAL_AUTHORED = ABSURD_TAIL.length

export function getAbsurd(index) {
  if (index < ABSURD_TAIL.length) return ABSURD_TAIL[index]
  return makeProceduralRound(index)
}

// ---------------------------------------------------------------------------
// EVOLVING CHROME
// ---------------------------------------------------------------------------
// The widget slowly stops looking like a captcha. The tiers are a security
// check; the wall at Tier IV arrives as a bureaucratic form; Tier V mutates into
// a terms-of-service and finally a court summons. Purely cosmetic — the game
// underneath is identical. CaptchaFrame renders per `key` (see CSS .frame--{key});
// everything here is data so no new components are needed.
export const CHROME = {
  captcha: {
    key: 'captcha',
    badge: 'hUMAN™ · Security Check',
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

// Which chrome the widget wears right now. Tiers I–III still look like a real
// security check (they have to — you can actually win them); Tier IV turns
// bureaucratic; Tier V follows the authored act and ends as a summons.
export function chromeFor({ inAbsurd, tierIndex = 0, absurdIndex = 0 }) {
  if (!inAbsurd) return tierAt(tierIndex).rigged ? CHROME.form : CHROME.captcha
  if (absurdIndex >= ABSURD_TAIL.length) return CHROME.summons
  return (ABSURD_TAIL[absurdIndex]?.act || 2) >= 3 ? CHROME.tos : CHROME.form
}

// Escalating "difficulty" label for the Tier V tail — purely cosmetic, purely a
// lie. The tiers use their own honest roman-numeral labels.
export function difficultyLabel(index) {
  const labels = [
    'Verification (hostile)',
    'Verification (paranoid)',
    'Verification (existential)',
    'Verification (why are you still here)',
  ]
  return labels[Math.min(Math.floor(index / 8), labels.length - 1)]
}

// ---------------------------------------------------------------------------
// PROCEDURAL ROUNDS  (after the authored tail, generate endless absurdity)
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
