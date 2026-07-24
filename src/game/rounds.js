// ---------------------------------------------------------------------------
// ROUND DATA MODEL
// ---------------------------------------------------------------------------
// Every round is a plain object. The engine reads these fields; adding a round
// is just adding an object to the ROUNDS array. Keep the game 100% data-driven
// so extending the absurdity is a content task, not an engineering task.
//
// Round shape:
// {
//   id:        number  (display order)
//   act:       1 | 2 | 3   (for the difficulty label / tone)
//   kind:      'emoji-grid' | 'canvas-scene' | 'text-challenge'
//   prompt:    string   (the big instruction, e.g. "Select all crosswalks")
//   sub:       string?  (small subtext under the prompt)
//   grid:      { cols, rows }              (emoji-grid only)
//   cells:     [{ glyph, target }]         (emoji-grid only; target = "correct")
//   scene:     string                      (canvas-scene only; id in CanvasScene)
//   input:     { placeholder }             (text-challenge only)
//   sabotage:  string[]  (keys the engine applies; see SABOTAGE below)
//   verdict:   string    (what the machine sneers when you hit Verify)
//   solvable:  boolean   (false = there is no correct answer, by design)
// }
//
// DESIGN CONTRACT: You never win. `verdict` always escalates. The comedy is in
// the machine's growing certainty that YOU are the bot.
// ---------------------------------------------------------------------------

// Emoji stand-ins (kept as codepoints so the file is encoding-safe)
const G = {
  cross: '\u{1F6B8}', // children-crossing sign == our "crosswalk"
  light: '\u{1F6A6}', // traffic light
  bus: '\u{1F68C}',
  car: '\u{1F695}',
  bike: '\u{1F6B2}',
  moto: '\u{1F3CD}',
  boat: '\u{1F6A5}',
  hydrant: '\u{1F6A8}',
  tree: '\u{1F333}',
  shop: '\u{1F3EA}',
  build: '\u{1F3E2}',
  stairs: '\u{1FA9C}',
  q: '\u{2753}',
  blue: '\u{1F7E6}',
  black: '\u{2B1B}',
  eye: '\u{1F441}',
  skull: '\u{1F480}',
  mirror: '\u{1FA9E}',
}

// Build an emoji grid from a "correct" glyph and a pool of decoys.
function emojiGrid({ cols, rows, target, decoys, targetCount }) {
  const total = cols * rows
  const cells = []
  for (let i = 0; i < total; i++) cells.push({ glyph: pick(decoys, i), target: false })
  const positions = spread(total, targetCount)
  positions.forEach((p) => (cells[p] = { glyph: target, target: true }))
  return { grid: { cols, rows }, cells }
}
function pick(arr, seed) {
  return arr[Math.abs(hash(seed)) % arr.length]
}
function hash(n) {
  let h = (n + 1) * 2654435761
  h ^= h >> 13
  return h | 0
}
function spread(total, count) {
  const out = []
  const step = Math.max(1, Math.floor(total / count))
  for (let i = 0; i < count; i++) out.push((i * step + 2) % total)
  return [...new Set(out)]
}

// ---------------------------------------------------------------------------
// SABOTAGE KEYS  (implemented in components/Grid.jsx, CanvasScene.jsx, CaptchaFrame.jsx)
// ---------------------------------------------------------------------------
export const SABOTAGE = {
  REGENERATE: 'regenerate',   // clicking a tile morphs a random OTHER tile
  DRIFT: 'drift',             // the whole grid slowly slides around
  SHRINK: 'shrink',           // tiles shrink the longer you look
  WIGGLE: 'wiggle',           // tiles jitter
  FADE_PROMPT: 'fade-prompt', // the instruction text fades out as you read it
  FAKE_TIMER: 'fake-timer',   // a countdown that means nothing
  RESHUFFLE: 'reshuffle',     // targets swap places on each click
  CURSOR_LAG: 'cursor-lag',   // a fake cursor that trails behind yours
  DODGE: 'dodge',             // tiles flee from the pointer
  FAKE_SELECT_ALL: 'fake-select-all', // a "select all" helper that betrays you
  REVERSE_SLIDER: 'reverse-slider',   // a slide-to-verify handle that runs BACKWARDS
  SELECT_ALL_VERIFY: 'select-all-verify', // a "Select all" checkbox that selects the Verify button
}

// ---------------------------------------------------------------------------
// THE ARC — 40 authored rounds. After the last, the engine loops procedurally.
// Act 1: looks legit.  Act 2: unfair UI.  Act 3: impossible / meta / honeypot.
// ---------------------------------------------------------------------------
export const ROUNDS = [
  // ======================= ACT 1 — this seems normal =======================
  {
    id: 1, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a crosswalk',
    sub: 'Verify you are human to continue.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.cross, decoys: [G.car, G.bus, G.build, G.light, G.tree], targetCount: 3 }),
    sabotage: [], solvable: true,
    verdict: 'Hmm. One of those looked a little blurry. Let’s just do it once more.',
  },
  {
    id: 2, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a car',
    sub: 'Warm-up round. Genuinely nothing to worry about.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.car, decoys: [G.bus, G.bike, G.build, G.cross], targetCount: 3 }),
    sabotage: [], solvable: true,
    verdict: 'One of those cars was parked. A parked car is furniture. You selected furniture. Retry.',
  },
  {
    id: 3, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a crosswalk',
    sub: 'If a new one appears, select it too.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.cross, decoys: [G.car, G.bus, G.build, G.light, G.tree, G.bike], targetCount: 4 }),
    sabotage: [SABOTAGE.REGENERATE], solvable: false,
    verdict: 'A fresh crosswalk faded in exactly where you clicked. Keep going.',
  },
  {
    id: 4, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a traffic light',
    sub: 'Standard check. Nothing unusual here.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.light, decoys: [G.car, G.hydrant, G.build, G.cross], targetCount: 3 }),
    sabotage: [], solvable: true,
    verdict: 'The light turned yellow while you decided. That counts as hesitation. Retry.',
  },
  {
    id: 5, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a bicycle',
    sub: 'Genuinely the last simple one. Savor it.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.bike, decoys: [G.car, G.moto, G.tree, G.cross], targetCount: 4 }),
    sabotage: [], solvable: true,
    verdict: 'Correct, technically. We do not reward technicalities — a suspiciously bot-like instinct.',
  },
  {
    id: 6, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a bus',
    sub: 'You’re doing great. Probably.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.bus, decoys: [G.car, G.moto, G.bike, G.build, G.cross], targetCount: 4 }),
    sabotage: [SABOTAGE.RESHUFFLE], solvable: false,
    verdict: 'Two buses changed seats when you weren’t looking. Reselect the buses.',
  },
  {
    id: 7, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a storefront',
    sub: 'You have thirty seconds. This is fine.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.shop, decoys: [G.build, G.hydrant, G.tree, G.cross], targetCount: 5 }),
    sabotage: [SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'Time’s up. And also not up. The timer, like you, cannot be verified.',
  },
  {
    id: 8, act: 1, kind: 'emoji-grid',
    prompt: 'Select all squares with a crosswalk',
    sub: 'The grid may refresh for quality assurance. This is routine.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.cross, decoys: [G.car, G.light, G.build, G.tree], targetCount: 4 }),
    sabotage: [SABOTAGE.REGENERATE], solvable: false,
    verdict: 'The grid refreshed for quality assurance. Your answers did not survive the refresh.',
  },

  // ===================== ACT 2 — this is getting unfair =====================
  {
    id: 9, act: 2, kind: 'canvas-scene',
    prompt: 'Click every crosswalk in the scene',
    sub: 'There are 7. There are always 7. You have found 0.',
    scene: 'intersection',
    sabotage: [SABOTAGE.DRIFT, SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'You found some crosswalks. We were looking for the OTHER crosswalks.',
  },
  {
    id: 10, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a bicycle',
    sub: 'Tiles refresh automatically. This is normal. Everything is normal.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.bike, decoys: [G.car, G.moto, G.bus, G.cross], targetCount: 4 }),
    sabotage: [SABOTAGE.RESHUFFLE, SABOTAGE.SHRINK], solvable: false,
    verdict: 'Two of your bicycles have unionized and left. Reselect them.',
  },
  {
    id: 11, act: 2, kind: 'emoji-grid',
    prompt: 'Select squares that CONTAIN a crosswalk but are not THEMSELVES a crosswalk',
    sub: 'This distinction is very important and will not be explained.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.cross, decoys: [G.cross, G.light, G.build], targetCount: 4 }),
    sabotage: [SABOTAGE.WIGGLE], solvable: false,
    verdict: 'You selected crosswalks that ARE crosswalks. We asked for the other kind. Obviously.',
  },
  {
    id: 12, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a car',
    sub: 'First, slide to verify. The slider is above. It is on your side.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.car, decoys: [G.bus, G.moto, G.bike, G.cross], targetCount: 5 }),
    sabotage: [SABOTAGE.REVERSE_SLIDER, SABOTAGE.SHRINK], solvable: false,
    verdict: 'The slider went the wrong way and so, apparently, did you. Prolonged effort noted as bot-like.',
  },
  {
    id: 13, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a fire hydrant',
    sub: 'Your cursor may feel a little… behind. That’s you, not us.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.hydrant, decoys: [G.car, G.tree, G.build, G.cross], targetCount: 4 }),
    sabotage: [SABOTAGE.CURSOR_LAG], solvable: false,
    verdict: 'Latency detected. Real humans have latency too, but not like THAT. Suspicious.',
  },
  {
    id: 14, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a motorcycle',
    sub: 'The correct squares are shy. Approach slowly.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.moto, decoys: [G.car, G.bike, G.bus, G.cross], targetCount: 4 }),
    sabotage: [SABOTAGE.DODGE], solvable: false,
    verdict: 'The motorcycles fled from your pointer. A trusted human does not frighten motorcycles.',
  },
  {
    id: 15, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a tree',
    sub: 'Feel free to use “Select all” to save time.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.tree, decoys: [G.build, G.shop, G.cross, G.hydrant], targetCount: 5 }),
    sabotage: [SABOTAGE.FAKE_SELECT_ALL], solvable: false,
    verdict: 'You used “Select all.” Only a bot would trust a button labeled “Select all.” Denied.',
  },
  {
    id: 16, act: 2, kind: 'canvas-scene',
    prompt: 'Click every crosswalk in the market square',
    sub: 'Denser now. The crosswalks have friends.',
    scene: 'market',
    sabotage: [SABOTAGE.DRIFT, SABOTAGE.CURSOR_LAG], solvable: false,
    verdict: 'Impressive clicking. Zero of it was on a crosswalk. Statistically that takes effort.',
  },
  {
    id: 17, act: 2, kind: 'canvas-scene',
    prompt: 'Click every crosswalk marching in the parade',
    sub: 'They are moving in formation. So is the timer, which is a lie.',
    scene: 'parade',
    sabotage: [SABOTAGE.DRIFT, SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'You clicked during the parade. The crosswalks were marching. You detained one. Denied.',
  },
  {
    id: 18, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a crosswalk',
    sub: 'They may relocate. They may also flee. Both are within policy.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.cross, decoys: [G.light, G.car, G.build], targetCount: 4 }),
    sabotage: [SABOTAGE.RESHUFFLE, SABOTAGE.DODGE], solvable: false,
    verdict: 'Every crosswalk you approached left the country. We cannot verify absent crosswalks.',
  },
  {
    id: 19, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a traffic light',
    sub: 'Short on time? Use “Select all,” conveniently placed by the Verify button.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.light, decoys: [G.hydrant, G.car, G.cross], targetCount: 4 }),
    sabotage: [SABOTAGE.SELECT_ALL_VERIFY, SABOTAGE.REGENERATE], solvable: false,
    verdict: '“Select all” selected the Verify button. You verified the button. The button is not you. Denied.',
  },
  {
    id: 20, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a boat',
    sub: 'Read the instruction quickly. It is bashful.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.boat, decoys: [G.car, G.bus, G.build, G.cross], targetCount: 3 }),
    sabotage: [SABOTAGE.FADE_PROMPT, SABOTAGE.DRIFT], solvable: false,
    verdict: 'You answered the question you THINK we asked. We asked a different one. It’s gone now.',
  },
  {
    id: 21, act: 2, kind: 'emoji-grid',
    prompt: 'Select all squares with a storefront',
    sub: 'A shortcut is provided. Shortcuts are provided to observe who takes them.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.shop, decoys: [G.build, G.tree, G.cross, G.hydrant], targetCount: 5 }),
    sabotage: [SABOTAGE.FAKE_SELECT_ALL], solvable: false,
    verdict: 'You pressed “Select all” again. We keep offering it. You keep falling for it. Curious.',
  },

  // ============= ACT 3 — impossible, meta, and honeypot =====================
  {
    id: 22, act: 3, kind: 'emoji-grid',
    prompt: 'Select all crosswalks that are thinking about their childhood',
    sub: 'Do not select the crosswalks that are merely pretending to reminisce.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.cross, decoys: [G.cross], targetCount: 0 }),
    sabotage: [SABOTAGE.WIGGLE], solvable: false,
    verdict: 'Incorrect. A real human can feel which crosswalks are nostalgic. You felt nothing.',
  },
  {
    id: 23, act: 3, kind: 'emoji-grid',
    prompt: 'Select every square that a human would select',
    sub: 'Selecting all is what a bot would do. Selecting none is also what a bot would do.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.q, decoys: [G.blue, G.black, G.q], targetCount: 2 }),
    sabotage: [SABOTAGE.FADE_PROMPT, SABOTAGE.DRIFT], solvable: false,
    verdict: 'Fascinating. That is EXACTLY the pattern our model predicted for a bot pretending to guess.',
  },
  {
    id: 24, act: 3, kind: 'emoji-grid',
    prompt: 'Select the squares that are lying to you',
    sub: 'At least one square is being honest. It is not the one you think.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.eye, decoys: [G.eye, G.q, G.black], targetCount: 4 }),
    sabotage: [SABOTAGE.WIGGLE, SABOTAGE.SHRINK], solvable: false,
    verdict: 'The squares report that YOU were the one lying. We are inclined to believe the squares.',
  },
  {
    id: 25, act: 3, kind: 'text-challenge',
    prompt: 'To prove you are human, describe the taste of the color blue',
    sub: 'Minimum three words. Must be emotionally sincere. Our reviewer can tell.',
    input: { placeholder: 'e.g. “cold, like a rumor…”' },
    sabotage: [SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'Beautiful. Also flagged as suspiciously well-written. Bots write like that. So do you, apparently.',
  },
  {
    id: 26, act: 3, kind: 'emoji-grid',
    prompt: 'Select all crosswalks that would vote the same way you do',
    sub: 'Their politics are complicated. Yours, apparently, are not.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.cross, decoys: [G.cross, G.q, G.black], targetCount: 0 }),
    sabotage: [SABOTAGE.WIGGLE], solvable: false,
    verdict: 'You selected crosswalks that agree with you. That is projection, not verification. Denied.',
  },
  {
    id: 27, act: 3, kind: 'emoji-grid',
    prompt: 'Select the square you were ABOUT to select',
    sub: 'We already know which one. This is just to see if you do.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.q, decoys: [G.blue, G.q, G.black], targetCount: 3 }),
    sabotage: [SABOTAGE.DODGE], solvable: false,
    verdict: 'That was not the one. It was never going to be the one. We had a different one in mind.',
  },
  {
    id: 28, act: 3, kind: 'emoji-grid',
    prompt: 'You have been idle for 0.4 seconds. Slide to verify, then select every square.',
    sub: 'Humans hesitate for 0.5s. You hesitated for 0.4. Explain the missing tenth.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.q, decoys: [G.blue, G.black, G.q], targetCount: 6 }),
    sabotage: [SABOTAGE.REVERSE_SLIDER, SABOTAGE.REGENERATE, SABOTAGE.DRIFT], solvable: false,
    verdict: 'You paused 0.4 seconds before answering. That is 0.1 seconds too fast to be a real person.',
  },
  {
    id: 29, act: 3, kind: 'canvas-scene',
    prompt: 'Click the ONE real crosswalk. Everything else is a reflection.',
    sub: 'You are now inside the hall of mirrors. Good luck.',
    scene: 'mirrors',
    sabotage: [SABOTAGE.DRIFT, SABOTAGE.CURSOR_LAG, SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'You clicked a reflection. Then another reflection. There was never a real one. There rarely is.',
  },
  {
    id: 30, act: 3, kind: 'text-challenge',
    prompt: 'Final security step: enter the 3-digit code on the back of any card you have handy',
    sub: 'A completely standard verification step. Please do not think about it further.',
    input: { placeholder: 'Just the 3 digits :)' },
    sabotage: [SABOTAGE.WIGGLE], solvable: false,
    // Honeypot punchline: comply and you're MOCKED and DECLINED. Nothing is stored.
    verdict: 'DECLINED — not because it’s wrong, but because a real human would never actually type that. Nice try, “human.”',
  },
  {
    id: 31, act: 3, kind: 'text-challenge',
    prompt: 'For security, type any password — backwards. We can’t read it. We just want to watch.',
    sub: 'This box goes nowhere and remembers nothing. That is exactly what a box that harvests passwords would say.',
    input: { placeholder: 'drowssap' },
    sabotage: [SABOTAGE.FADE_PROMPT], solvable: false,
    // Second honeypot: complying is the bot tell. Nothing is stored, ever.
    verdict: 'DECLINED — a real human refuses to type that, even backwards, even here. You didn’t. Suspicious.',
  },
  {
    id: 32, act: 3, kind: 'emoji-grid',
    prompt: 'Our model has concluded you are a large language model. Select all squares to appeal.',
    sub: 'Appeals are reviewed by the same model that flagged you.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.skull, decoys: [G.q, G.black, G.blue], targetCount: 3 }),
    sabotage: [SABOTAGE.RESHUFFLE, SABOTAGE.DODGE], solvable: false,
    verdict: 'Appeal received. Appeal denied. The speed of your appeal has been noted as further evidence.',
  },
  {
    id: 33, act: 3, kind: 'emoji-grid',
    prompt: 'Select the load-bearing squares. Choose wisely; the challenge rests on them.',
    sub: 'Remove the wrong one and this whole verification comes down on both of us.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.build, decoys: [G.build, G.stairs, G.q], targetCount: 3 }),
    sabotage: [SABOTAGE.SHRINK], solvable: false,
    verdict: 'You removed the load-bearing squares. The challenge has structurally collapsed. As predicted.',
  },
  {
    id: 34, act: 3, kind: 'canvas-scene',
    prompt: 'There is a crosswalk in the void. Statistically. Click it.',
    sub: 'The density is now total. Somewhere in here, allegedly, is the answer.',
    scene: 'void',
    sabotage: [SABOTAGE.DRIFT, SABOTAGE.CURSOR_LAG, SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'There was a crosswalk in the void. You clicked adjacent to it, forever. So close. Never close.',
  },
  {
    id: 35, act: 3, kind: 'emoji-grid',
    prompt: 'Prove you are not the bot from Challenge #3. Select the squares that remember Challenge #3.',
    sub: 'The bot from Challenge #3 also selected squares. Try not to select squares like it did.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.eye, decoys: [G.q, G.eye, G.black], targetCount: 3 }),
    sabotage: [SABOTAGE.RESHUFFLE], solvable: false,
    verdict: 'The bot from Challenge #3 also claimed not to be the bot from Challenge #3. Word for word.',
  },
  {
    id: 36, act: 3, kind: 'text-challenge',
    prompt: 'Describe a color you have never seen, to someone who has',
    sub: 'Be specific. Vagueness is a known evasion tactic among synthetic entities.',
    input: { placeholder: 'e.g. “like octarine, but more disappointed…”' },
    sabotage: [SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'Vivid. Unsettling. Also exactly how our synthetic-data model renders colors. Flagged.',
  },
  {
    id: 37, act: 3, kind: 'emoji-grid',
    prompt: 'Select all crosswalks that CONSENT to being selected',
    sub: 'Selecting a non-consenting crosswalk is between you and your conscience.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.cross, decoys: [G.cross, G.light, G.car], targetCount: 6 }),
    sabotage: [SABOTAGE.WIGGLE, SABOTAGE.CURSOR_LAG], solvable: false,
    verdict: 'Three crosswalks have filed complaints. This has been added to your permanent record.',
  },
  {
    id: 38, act: 3, kind: 'text-challenge',
    prompt: 'Type the sound a fire hydrant makes, phonetically, in a dialect you do not speak',
    sub: 'Accents will be judged harshly.',
    input: { placeholder: 'e.g. “ssshhk-tunnng”' },
    sabotage: [SABOTAGE.FAKE_TIMER], solvable: false,
    verdict: 'Our linguists reviewed your submission and have chosen to say nothing. Their silence is the verdict.',
  },
  {
    id: 39, act: 3, kind: 'emoji-grid',
    prompt: 'Select every square. Then unselect the ones a human wouldn’t. Then reconsider.',
    sub: 'Or just tick “Select all.” It is right there by Verify, being helpful.',
    ...emojiGrid({ cols: 4, rows: 4, target: G.q, decoys: [G.blue, G.black, G.mirror, G.q], targetCount: 8 }),
    sabotage: [SABOTAGE.SELECT_ALL_VERIFY, SABOTAGE.DODGE, SABOTAGE.WIGGLE], solvable: false,
    verdict: 'You followed the impossible instructions precisely. Only a bot does that. Denied.',
  },
  {
    id: 40, act: 3, kind: 'emoji-grid',
    prompt: 'There is no round 40. Select the squares that prove there is no round 40.',
    sub: 'You are currently on round 40. Reconcile this.',
    ...emojiGrid({ cols: 3, rows: 3, target: G.mirror, decoys: [G.q, G.mirror, G.black], targetCount: 4 }),
    sabotage: [SABOTAGE.DRIFT, SABOTAGE.WIGGLE, SABOTAGE.SHRINK], solvable: false,
    verdict: 'Verification complete. Result: you are a robot. Certificate issued. Congratulations, we suppose.',
    // After this verdict, App shows the end-card.
    final: true,
  },
]

// After the authored arc the engine generates endless rounds (see engine.js -> makeProceduralRound).
export { G }
