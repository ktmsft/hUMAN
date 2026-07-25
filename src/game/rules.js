// ---------------------------------------------------------------------------
// RULES — the (secret) definition of "correct" for a round.
// ---------------------------------------------------------------------------
// Each rule has: the on-screen prompt, a `test(live)` predicate over a tile's
// live attributes, and a `hint` we reveal only AFTER a fail so the player feels
// the game is fair (it is... at first). `traps` names the near-miss tiles a
// generator should sprinkle so the nuance actually bites.
//
// live = { cat, ...attrs } with a dynamic light's `color` set to its CURRENT
// value at verify time.
// ---------------------------------------------------------------------------

export const RULES = {
  crosswalk: {
    id: 'crosswalk',
    prompt: 'Select all squares with a crosswalk',
    hint: 'A crosswalk showing a red DON’T WALK hand does not count. Only walkable crosswalks.',
    test: (t) => t.cat === 'crosswalk' && t.signal !== 'dont',
    // near-miss traps to include:
    traps: ['crosswalk:dont'],
  },
  redLight: {
    id: 'redLight',
    prompt: 'Select all traffic lights showing STOP',
    hint: 'Red means stop — that’s the one we want. Green and yellow don’t count.',
    test: (t) => t.cat === 'light' && t.color === 'red',
    traps: ['light:green', 'light:yellow'],
  },
  // Same as redLight but with dynamic lights: correct = red AT THE MOMENT you verify.
  redLightTimed: {
    id: 'redLightTimed',
    prompt: 'Select every light that is RED right now',
    hint: 'The lights change. A light must still be red the instant you press Verify.',
    test: (t) => t.cat === 'light' && t.color === 'red',
    traps: ['light:green'],
  },
  bus: {
    id: 'bus',
    prompt: 'Select all buses',
    hint: 'Full-size buses only. Shuttle vans are not buses, no matter their ambitions.',
    test: (t) => t.cat === 'vehicle' && t.kind === 'bus',
    traps: ['vehicle:shuttle', 'vehicle:car'],
  },
  // Tier IV compound rule: two conditions at once.
  redOrWalk: {
    id: 'redOrWalk',
    prompt: 'Select every light showing STOP and every walkable crosswalk',
    hint: 'Two things at once: RED lights, AND crosswalks that are not showing DON’T WALK.',
    test: (t) => (t.cat === 'light' && t.color === 'red') || (t.cat === 'crosswalk' && t.signal !== 'dont'),
    traps: ['light:green', 'crosswalk:dont'],
  },
  // A late rule that quietly contradicts redLight — used by the "goalpost" steal.
  greenLight: {
    id: 'greenLight',
    prompt: 'Select all lights that mean GO',
    hint: 'In this jurisdiction, green means go. Obviously. It always did.',
    test: (t) => t.cat === 'light' && t.color === 'green',
    traps: ['light:red'],
  },
}

// Build a concrete trap tile from a "cat:variant" trap key.
import { crosswalk, light, vehicle } from './tiles.js'
export function trapTile(key) {
  const [cat, variant] = key.split(':')
  if (cat === 'crosswalk') return crosswalk(variant)
  if (cat === 'light') return light(variant)
  if (cat === 'vehicle') return vehicle(variant)
  return vehicle('car')
}

// Build a correct-by-construction tile for a rule (before dynamics kick in).
import { crosswalk as xw, light as lt, vehicle as vh } from './tiles.js'
export function correctTile(ruleId, dynamic = false) {
  switch (ruleId) {
    case 'crosswalk': return xw(Math.random() < 0.5 ? 'walk' : 'none')
    case 'redLight': return lt('red')
    case 'redLightTimed': return lt('red', dynamic)
    case 'bus': return vh('bus')
    case 'redOrWalk': return Math.random() < 0.5 ? lt('red', dynamic) : xw(Math.random() < 0.5 ? 'walk' : 'none')
    case 'greenLight': return lt('green')
    default: return lt('red')
  }
}
