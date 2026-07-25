// ---------------------------------------------------------------------------
// TILE SYSTEM
// ---------------------------------------------------------------------------
// A tile is an image with HIDDEN ATTRIBUTES. The "correct" rule for a round
// reads those attributes (see rules.js). This is what lets us do nuance:
// a crosswalk showing DON'T WALK isn't a valid crosswalk; only a RED light
// counts; a shuttle van isn't a bus.
//
// Right now tiles render as concept-accurate PLACEHOLDER art (drawn in
// ImageGrid.jsx) so every rule is visible and testable. To go photorealistic,
// give a tile a `src` (see images.manifest.js) and ImageGrid renders the <img>
// instead of the placeholder — attributes and rules stay identical.
//
// Tile shape:
//   { cat, attrs: {...}, dynamic?: {cycle:[...], period} , src? }
// The engine flattens { cat, ...attrs } into a "live" object for rule.test(),
// and for dynamic tiles overrides the cycling attribute with its current value.
// ---------------------------------------------------------------------------

// crosswalk with a pedestrian signal state: 'none' | 'walk' | 'dont'
export const crosswalk = (signal = 'none') => ({ cat: 'crosswalk', attrs: { signal } })

// traffic light: color 'red' | 'yellow' | 'green'. dynamic=true cycles on a timer.
export const light = (color = 'red', dynamic = false) =>
  dynamic
    ? { cat: 'light', attrs: { color }, dynamic: { cycle: ['red', 'green'], period: 1100 } }
    : { cat: 'light', attrs: { color } }

// vehicles: kind 'bus' | 'shuttle' | 'car' | 'bike' | 'moto'
export const vehicle = (kind) => ({ cat: 'vehicle', attrs: { kind } })

// pure decoys with no path to correctness
export const decoy = (kind) => ({ cat: 'decoy', attrs: { kind } })

// Emoji used by the placeholder art for vehicles/decoys.
export const GLYPH = {
  bus: '\u{1F68C}', shuttle: '\u{1F690}', car: '\u{1F695}', bike: '\u{1F6B2}', moto: '\u{1F3CD}',
  hydrant: '\u{1F6A8}', tree: '\u{1F333}', building: '\u{1F3E2}', shop: '\u{1F3EA}', bench: '\u{1FA91}',
}

// Flatten a tile to the "live" attrs a rule tests. `liveColor` overrides a
// dynamic light's color at evaluation time (that's what makes timing matter).
export function liveAttrs(tile, liveColor) {
  const base = { cat: tile.cat, ...tile.attrs }
  if (tile.dynamic && liveColor) base.color = liveColor
  return base
}

// Decoy pools used to pad grids with plausible-but-wrong tiles.
export const DECOY_TILES = [
  vehicle('car'), vehicle('bike'), vehicle('moto'),
  decoy('hydrant'), decoy('tree'), decoy('building'), decoy('shop'), decoy('bench'),
]
