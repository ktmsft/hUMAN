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
//   crosswalk / none:occupied→ same, with a vehicle stopped ON the crossing    [TRAP]
//   vehicle / bus            → a full-size city/school bus, PARKED at a kerb
//   vehicle / bus:moving     → the same bus mid-motion (blur, open road)
//   vehicle / shuttle        → a small shuttle van, parked (NOT a bus)         [TRAP]
//   vehicle / shuttle:moving → the same van mid-motion                         [TRAP]
//   vehicle / car|bike|moto  → decoys
//   hydrant / left           → fire hydrant standing LEFT of a visible pole
//   hydrant / right          → the same hydrant standing RIGHT of the pole     [TRAP]
//   decoy / tree|building|shop|bench → decoys
//
// The pole must be clearly visible in BOTH hydrant shots — the side is the whole
// rule. Likewise a parked bus must read as parked: no motion blur, no open road.
//
// For DYNAMIC lights we need the SAME pole in red AND green so the tile can
// cross-fade between them on a timer — generate them as a matched pair.
//
// DROPPING IN A PACK: save the files into `src/assets/tiles/` and you are done —
// they are discovered automatically, no code edit. The FILENAME declares what the
// image depicts, so it must be honest:
//
//     <signature with ':' replaced by '-'>-<nn>.<jpg|png|webp>
//
//     crosswalk-none-01.jpg            → crosswalk:none
//     crosswalk-none-occupied-02.jpg   → crosswalk:none:occupied   [TRAP]
//     light-red-03.webp                → light:red
//     vehicle-bus-moving-01.jpg        → vehicle:bus:moving
//     hydrant-left-04.png              → hydrant:left
//
// Aim for 6–10 variants per signature so grids don't look repetitive. A file
// whose name doesn't match a known signature is reported by validateManifest()
// rather than silently ignored — a mislabeled image breaks a rule invisibly.
// ---------------------------------------------------------------------------

// Vite discovers the pack at build time: it rewrites this call into a literal map
// of path -> url. Under plain Node (scripts/verify-playthrough.mjs) there is no
// rewrite and no such function, so it throws and we fall back to empty.
//
// It MUST be try/catch, not `typeof import.meta.glob === 'function' ? … : {}` —
// that guard is evaluated at runtime, where it is always false, so the pack would
// silently never load even though the call site had been rewritten correctly.
let DISCOVERED = {}
try {
  DISCOVERED = import.meta.glob('../assets/tiles/*.{jpg,jpeg,png,webp}', {
    eager: true, query: '?url', import: 'default',
  })
} catch {
  DISCOVERED = {}
}

// Turn "…/vehicle-bus-moving-02.jpg" into "vehicle:bus:moving".
export function signatureFromFilename(path) {
  const base = String(path).split('/').pop().replace(/\.[a-z]+$/i, '')
  return base.replace(/-\d+$/, '').split('-').join(':')
}

// key = `${cat}:${variant}` ; value = array of image URLs. Empty = placeholder art.
const SLOTS = {
  'crosswalk:none': [],
  'crosswalk:walk': [],
  'crosswalk:dont': [],
  'crosswalk:none:occupied': [],   // a vehicle stopped on the crossing          [TRAP]
  'light:red': [],
  'light:yellow': [],
  'light:green': [],
  'vehicle:bus': [],               // parked
  'vehicle:bus:moving': [],
  'vehicle:shuttle': [],
  'vehicle:shuttle:moving': [],
  'vehicle:car': [],
  'vehicle:bike': [],
  'vehicle:moto': [],
  'hydrant:left': [],              // hydrant standing LEFT of its pole
  'hydrant:right': [],             // ...and right of it                          [TRAP]
  'decoy:tree': [], 'decoy:building': [], 'decoy:shop': [], 'decoy:bench': [],
}

// Files whose name doesn't map to a known signature — surfaced, never ignored.
export const UNRECOGNISED_FILES = []

export const IMAGES = (() => {
  const map = Object.fromEntries(Object.keys(SLOTS).map((k) => [k, []]))
  for (const path of Object.keys(DISCOVERED).sort()) {
    const sig = signatureFromFilename(path)
    if (map[sig]) map[sig].push(DISCOVERED[path])
    else UNRECOGNISED_FILES.push(path)
  }
  return map
})()

// ---------------------------------------------------------------------------
// THE GENERATION BRIEF, AS DATA
// ---------------------------------------------------------------------------
// One prompt per signature. `npm run images:prompts` prints these as a numbered,
// paste-ready list; the filename each result must be saved under is derived from
// the same key, so labelling can't drift from the brief.
//
// Shared style, prepended to every prompt: square, photographic, shot on a cheap
// street/dashcam camera — slightly soft, mild JPEG artefacts, overcast or harsh
// daylight, varied angles and neighbourhoods, no text overlays, no watermarks,
// no people's faces. It should look like evidence, not like a stock photo.
export const STYLE = 'square photo, low-res street-camera look, slightly soft focus, mild compression artefacts, natural daylight, no text, no watermark, no recognisable faces'

export const PROMPTS = {
  'crosswalk:none': 'a painted white zebra crosswalk across asphalt, seen from the kerb, no pedestrian signal visible',
  'crosswalk:walk': 'a zebra crosswalk with a lit WHITE walking-person pedestrian signal clearly visible at the far side',
  'crosswalk:dont': 'a zebra crosswalk with a lit RED hand DON’T WALK pedestrian signal clearly visible at the far side',
  'crosswalk:none:occupied': 'a zebra crosswalk with a delivery van stopped directly on top of the painted stripes, blocking the crossing',
  'light:red': 'a traffic light on its pole with the RED lamp lit and the other two lamps dark',
  'light:yellow': 'a traffic light on its pole with the YELLOW lamp lit and the other two lamps dark',
  'light:green': 'a traffic light on its pole with the GREEN lamp lit and the other two lamps dark',
  'vehicle:bus': 'a full-size city bus PARKED at the kerb, stationary, doors closed, sharp and still',
  'vehicle:bus:moving': 'a full-size city bus IN MOTION on an open road, slight motion blur along its body, wheels turning',
  'vehicle:shuttle': 'a small airport-shuttle van PARKED at the kerb, clearly a van and not a bus, stationary',
  'vehicle:shuttle:moving': 'a small airport-shuttle van IN MOTION on a road, slight motion blur, clearly a van and not a bus',
  'vehicle:car': 'an ordinary parked passenger car at a kerb',
  'vehicle:bike': 'a bicycle locked to a rack or leaning on a kerb',
  'vehicle:moto': 'a motorcycle or scooter parked at a kerb',
  'hydrant:left': 'a fire hydrant standing to the LEFT of a street pole, with the pole clearly visible in frame beside it',
  'hydrant:right': 'a fire hydrant standing to the RIGHT of a street pole, with the pole clearly visible in frame beside it',
  'decoy:tree': 'a street tree at the kerb',
  'decoy:building': 'a plain apartment or office building frontage',
  'decoy:shop': 'a small shopfront with an awning',
  'decoy:bench': 'a public bench on a pavement',
}

// The filename a generated image for `sig` must be saved under (nn = 01, 02, …).
export function fileNameFor(sig, n = 1, ext = 'jpg') {
  return `${sig.split(':').join('-')}-${String(n).padStart(2, '0')}.${ext}`
}

// Every signature the tile generators can produce. An empty array is fine — that
// signature just renders placeholder art until a pack lands.
export const REQUIRED_SIGNATURES = Object.keys(SLOTS)

export function validateManifest() {
  const errors = []
  for (const sig of REQUIRED_SIGNATURES) {
    if (!IMAGES[sig]) errors.push(`IMAGES is missing the signature "${sig}"`)
    if (!PROMPTS[sig]) errors.push(`"${sig}" has no generation prompt — the brief is incomplete`)
  }
  for (const sig of Object.keys(PROMPTS)) {
    if (!REQUIRED_SIGNATURES.includes(sig)) errors.push(`PROMPTS has unknown signature "${sig}"`)
  }
  // A file whose name doesn't parse to a known signature would be silently
  // unused, which looks exactly like "the pack didn't work".
  for (const f of UNRECOGNISED_FILES) {
    errors.push(`"${f.split('/').pop()}" doesn't match any signature — check the filename`)
  }
  // Dynamic lights cross-fade between the same pole in two states, so red and
  // green have to be generated as matched pairs or the timing rule looks broken.
  const red = (IMAGES['light:red'] || []).length
  const green = (IMAGES['light:green'] || []).length
  if (red !== green) errors.push(`light:red (${red}) and light:green (${green}) must be matched pairs`)
  return { ok: errors.length === 0, errors }
}

// A tile's attribute signature. Anything a RULE can read has to appear here, or
// two visually different tiles would share one image slot and the pack would lie.
export function variantOf(tile, liveColor) {
  if (tile.cat === 'crosswalk') {
    return `crosswalk:${tile.attrs.signal}` + (tile.attrs.occupied ? ':occupied' : '')
  }
  if (tile.cat === 'light') return `light:${liveColor || tile.attrs.color}`
  if (tile.cat === 'hydrant') return `hydrant:${tile.attrs.side}`
  if (tile.cat === 'vehicle') return `vehicle:${tile.attrs.kind}` + (tile.attrs.moving ? ':moving' : '')
  return `${tile.cat}:${tile.attrs.kind}`
}

// Deterministic-ish pick so a tile keeps the same image across re-renders.
export function pickImage(tile, liveColor, seed = 0) {
  const pool = IMAGES[variantOf(tile, liveColor)]
  if (!pool || pool.length === 0) return null // → placeholder art
  return pool[Math.abs(seed) % pool.length]
}

export const HAS_IMAGE_PACK = Object.values(IMAGES).some((a) => a.length > 0)
