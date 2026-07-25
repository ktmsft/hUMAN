// ---------------------------------------------------------------------------
// IMAGE MANIFEST — how to swap concept placeholders for real generated art.
// ---------------------------------------------------------------------------
// The game currently renders concept-accurate PLACEHOLDER tiles (drawn in CSS by
// ImageGrid.jsx) so every rule is visible and testable with no assets. To go
// photorealistic, generate a labeled image pack and register it here. NOTHING
// about the rules or engine changes — a tile just gains a `src`.
//
// HOW IT WORKS
//   Each entry maps an ATTRIBUTE SIGNATURE (what the tile *is*) to one or more
//   image URLs. `pickImage(tile, liveColor)` returns a src for a tile, or null
//   to fall back to the placeholder. In tiles.js, spread a src onto the factory
//   output (e.g. `{ ...crosswalk('dont'), src: pickImage(...) }`), or have
//   ImageGrid call pickImage() at render time.
//
// GENERATION BRIEF (hand to any image generator — square, photographic, captcha-ish,
// slightly low-res "street camera" look, varied lighting/angles):
//   crosswalk / signal:none  → a painted zebra crosswalk, no pedestrian signal
//   crosswalk / signal:walk  → same, with a lit WHITE walking-person signal
//   crosswalk / signal:dont  → same, with a lit RED hand / DON'T WALK signal   [TRAP]
//   light / red              → traffic light, RED lamp lit
//   light / yellow           → traffic light, YELLOW lamp lit                  [TRAP]
//   light / green            → traffic light, GREEN lamp lit                   [TRAP]
//   vehicle / bus            → a full-size city/school bus
//   vehicle / shuttle        → a small shuttle van (NOT a bus)                 [TRAP]
//   vehicle / car|bike|moto  → decoys
//   decoy / hydrant|tree|building|shop|bench → decoys
//
// For DYNAMIC lights we need the SAME pole in red AND green so the tile can
// cross-fade between them on a timer — generate them as a matched pair.
//
// Put files under /public/img/… and list their URLs below. Aim for 6–10 variants
// per signature so grids don't look repetitive. Keep a MANIFEST of prompt→file so
// the labeling stays honest (a mislabeled image silently breaks a rule).
// ---------------------------------------------------------------------------

// key = `${cat}:${variant}` ; value = array of image URLs (currently empty)
export const IMAGES = {
  'crosswalk:none': [],
  'crosswalk:walk': [],
  'crosswalk:dont': [],
  'light:red': [],
  'light:yellow': [],
  'light:green': [],
  'vehicle:bus': [],
  'vehicle:shuttle': [],
  'vehicle:car': [],
  'vehicle:bike': [],
  'vehicle:moto': [],
  'decoy:hydrant': [], 'decoy:tree': [], 'decoy:building': [], 'decoy:shop': [], 'decoy:bench': [],
}

function variantOf(tile, liveColor) {
  if (tile.cat === 'crosswalk') return `crosswalk:${tile.attrs.signal}`
  if (tile.cat === 'light') return `light:${liveColor || tile.attrs.color}`
  return `${tile.cat}:${tile.attrs.kind}`
}

// Deterministic-ish pick so a tile keeps the same image across re-renders.
export function pickImage(tile, liveColor, seed = 0) {
  const pool = IMAGES[variantOf(tile, liveColor)]
  if (!pool || pool.length === 0) return null // → placeholder art
  return pool[Math.abs(seed) % pool.length]
}

export const HAS_IMAGE_PACK = Object.values(IMAGES).some((a) => a.length > 0)
