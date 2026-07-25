// Headless check of the merged engine: are I-III honestly winnable, is IV rigged,
// does the tail terminate at a certificate, and does chrome escalate?
import {
  generateChallenge, evaluate, steal, getAbsurd, chromeFor, ABSURD_COUNT,
  TIERS, tierAt, RIG_LIMIT, liveAttrs, STEAL_COUNT,
} from '../src/game/engine.js'
import { RULES } from '../src/game/rules.js'
import { validateManifest, pickImage, HAS_IMAGE_PACK, REQUIRED_SIGNATURES, IMAGES } from '../src/game/images.manifest.js'

let fail = 0
const ok = (cond, msg) => { console.log((cond ? '  PASS ' : '  FAIL ') + msg); if (!cond) fail++ }

// --- 1. every tier generates a solvable challenge, and a perfect answer passes
console.log('\n[1] honest evaluation across all tiers')
for (let t = 0; t < TIERS.length; t++) {
  let allPassed = true, anyEmpty = false
  for (let n = 0; n < 200; n++) {
    const r = generateChallenge(t)
    const live = r.tiles.map((tile) => liveAttrs(tile, tile.attrs.color))
    const rule = RULES[r.ruleId]
    const correct = new Set()
    live.forEach((tile, i) => { if (rule.test(tile)) correct.add(i) })
    if (correct.size === 0) anyEmpty = true
    const res = evaluate(r, correct, live)
    if (!res.passed) allPassed = false
  }
  ok(allPassed, `tier ${TIERS[t].roman}: a perfect selection always passes`)
  ok(!anyEmpty, `tier ${TIERS[t].roman}: never generates a grid with zero correct tiles`)
}

// --- 2. a wrong answer always fails (grader is honest in both directions)
console.log('\n[2] wrong answers fail')
let wrongRejected = true
for (let n = 0; n < 200; n++) {
  const r = generateChallenge(0)
  const live = r.tiles.map((tile) => liveAttrs(tile, tile.attrs.color))
  const rule = RULES[r.ruleId]
  const correct = new Set()
  live.forEach((tile, i) => { if (rule.test(tile)) correct.add(i) })
  const bad = new Set(correct)
  const intruder = live.findIndex((tile, i) => !correct.has(i))
  if (intruder >= 0) bad.add(intruder)
  if (intruder >= 0 && evaluate(r, bad, live).passed) wrongRejected = false
}
ok(wrongRejected, 'selecting one extra wrong tile never passes')

// --- 3. rig topology
console.log('\n[3] the wall')
ok(TIERS.filter((t) => t.rigged).length === 1, 'exactly one rigged tier')
ok(TIERS[TIERS.length - 1].rigged, 'the rigged tier is the last one (IV)')
ok(TIERS.slice(0, 3).every((t) => !t.rigged), 'tiers I-III are not rigged')
const msgs = new Set()
for (let i = 0; i < RIG_LIMIT; i++) msgs.add(steal(i).message)
ok(msgs.size === RIG_LIMIT, `the ${RIG_LIMIT} thefts you actually see are all different messages`)
ok(STEAL_COUNT >= RIG_LIMIT, `${STEAL_COUNT} steal variants authored for RIG_LIMIT=${RIG_LIMIT}`)

// --- 4. the tail terminates at the certificate, then goes forever
console.log('\n[4] tier V tail')
ok(ABSURD_COUNT > 0, `tail has ${ABSURD_COUNT} authored rounds`)
ok(getAbsurd(0).act >= 2, 'tail opens at act 2 (act-1 warm-ups are handled by the real tiers)')
const finals = []
for (let i = 0; i < ABSURD_COUNT; i++) if (getAbsurd(i).final) finals.push(i)
ok(finals.length === 1 && finals[0] === ABSURD_COUNT - 1, 'exactly one final round, and it is last')
ok(!!getAbsurd(ABSURD_COUNT + 5).procedural, 'past the authored tail, rounds are procedural (endless)')
let noPass = true
for (let i = 0; i < ABSURD_COUNT; i++) if (getAbsurd(i).solvable === true) noPass = false
ok(noPass, 'no round in the tail is marked solvable — tier V never resolves to a pass')

// --- 5. chrome escalates
console.log('\n[5] evolving chrome')
ok(chromeFor({ inAbsurd: false, tierIndex: 0 }).key === 'captcha', 'tier I wears the captcha skin')
ok(chromeFor({ inAbsurd: false, tierIndex: 3 }).key === 'form', 'tier IV (the wall) turns bureaucratic')
ok(chromeFor({ inAbsurd: true, absurdIndex: 0 }).key === 'form', 'tier V opens as a form')
const tosAt = Array.from({ length: ABSURD_COUNT }, (_, i) => chromeFor({ inAbsurd: true, absurdIndex: i }).key)
ok(tosAt.includes('tos'), 'tier V reaches terms-of-service')
ok(chromeFor({ inAbsurd: true, absurdIndex: ABSURD_COUNT + 1 }).key === 'summons', 'the endless tail is a court summons')

// --- 6. simulated full playthrough
console.log('\n[6] simulated playthrough (perfect player)')
let tier = 0, streak = 0, steals = 0, guard = 0, reclassified = false
while (guard++ < 500 && !reclassified) {
  const r = generateChallenge(tier)
  const live = r.tiles.map((tile) => liveAttrs(tile, tile.attrs.color))
  const rule = RULES[r.ruleId]
  const correct = new Set()
  live.forEach((tile, i) => { if (rule.test(tile)) correct.add(i) })
  const passed = evaluate(r, correct, live).passed
  if (tierAt(tier).rigged && passed && streak >= 2) {
    steals++; streak = 0
    if (steals >= RIG_LIMIT) reclassified = true
  } else if (passed) {
    streak++
    if (streak >= 3) { streak = 0; if (tier < TIERS.length - 1) tier++ }
  }
}
ok(tier === TIERS.length - 1, 'a perfect player graduates I -> II -> III and lands on IV')
ok(reclassified, `a perfect player is robbed ${RIG_LIMIT}x at IV and gets reclassified into V`)
ok(steals === RIG_LIMIT, 'never graduates IV — only ever leaves by reclassification')

// --- 7. image pack wiring (placeholders today, photoreal when a pack lands)
console.log('\n[7] image pack')
const man = validateManifest()
ok(man.ok, man.ok ? 'manifest is self-consistent' : 'manifest errors: ' + man.errors.join('; '))
const everySig = new Set()
for (let t = 0; t < TIERS.length; t++) {
  for (let n = 0; n < 100; n++) {
    for (const tile of generateChallenge(t).tiles) {
      everySig.add(tile.cat === 'crosswalk' ? `crosswalk:${tile.attrs.signal}`
        : tile.cat === 'light' ? `light:${tile.attrs.color}`
        : `${tile.cat}:${tile.attrs.kind}`)
    }
  }
}
const uncovered = [...everySig].filter((s) => !REQUIRED_SIGNATURES.includes(s))
ok(uncovered.length === 0, uncovered.length ? `signatures with no manifest slot: ${uncovered.join(', ')}` : 'every generated tile signature has a manifest slot')
ok(HAS_IMAGE_PACK === Object.values(IMAGES).some((a) => a.length > 0), 'HAS_IMAGE_PACK reflects the manifest')
if (!HAS_IMAGE_PACK) {
  const t = { cat: 'light', attrs: { color: 'red' } }
  ok(pickImage(t, 'red') === null, 'with no pack registered, tiles fall back to placeholder art')
}

console.log(fail === 0 ? '\nALL CHECKS PASSED' : `\n${fail} CHECK(S) FAILED`)
process.exit(fail === 0 ? 0 : 1)
