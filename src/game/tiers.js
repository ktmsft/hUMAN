// ---------------------------------------------------------------------------
// TIERS — escalating difficulty bands. The app picks a challenge at RANDOM from
// the current tier's pool. Clear 3 in a row to GRADUATE to the next tier.
// ---------------------------------------------------------------------------
// Tiers I–III are genuinely winnable — real skill, real progress. Tier IV is
// the wall: it steals the clinching 3rd win every time (rigged), so you can
// reach 2-in-a-row but never graduate. Tier V is the finale "no verified human
// has ever seen" — you only reach it once the system reclassifies you as a bot
// (see engine.js). Its content is the absurd/meta/honeypot tail (rounds.js).
//
// tier: { id, roman, name, cols, dynamic, period, rigged, pool:[ruleId] }
//   cols²  = tiles ; dynamic+period = cycling lights (timing) ; pool = rules to
//   pick from at random each round.
// ---------------------------------------------------------------------------
export const TIERS = [
  { id: 1, roman: 'I',   name: 'Basic Verification',       cols: 3, dynamic: false, period: 0,    rigged: false, pool: ['crosswalk', 'redLight', 'bus'] },
  { id: 2, roman: 'II',  name: 'Enhanced Verification',    cols: 4, dynamic: false, period: 0,    rigged: false, pool: ['crosswalk', 'redLight', 'bus'] },
  { id: 3, roman: 'III', name: 'Advanced Verification',    cols: 5, dynamic: true,  period: 1200, rigged: false, pool: ['redLightTimed', 'crosswalk'] },
  { id: 4, roman: 'IV',  name: 'Adversarial Verification', cols: 6, dynamic: true,  period: 750,  rigged: true,  pool: ['redLightTimed', 'redOrWalk'] },
]

// Tier V is not in the array — it's the "unseen" tier, handled as the absurd
// tail. This label is shown only once the player has been reclassified.
export const TIER_V = { id: 5, roman: 'V', name: '█████ Verification', locked: true }

// How many times Tier IV steals your win before it gives up and reclassifies
// you as non-human (granting forced entry to Tier V).
export const RIG_LIMIT = 3

export const TIER_COUNT = TIERS.length
export function tierAt(i) { return TIERS[Math.min(i, TIERS.length - 1)] }
