# hUMAN™ — Design Spec

> A standalone web game that impersonates a "select all crosswalks" CAPTCHA,
> lets you genuinely win for three tiers, then takes the fourth away from you
> forever. You never prove you're human. The machine grows ever more certain that
> **you** are the bot — and finally acts on it.

**Status: merged and verified.** The tiered skill loop and the authored absurd
tail are now one game: a landing screen, tiers I–III you can really graduate,
the rigged wall at Tier IV, reclassification into Tier V, 32 authored tail rounds
across canvas/emoji/text challenges, 12 sabotage mechanics, evolving chrome, and
a robot certificate with a downloadable PNG. `npm run build` is clean and
`npm run verify` asserts the invariants below still hold.

---

## 1. Concept

A pixel-perfect-ish parody of the reCAPTCHA / hCaptcha "prove you aren't a robot"
image challenge. It starts as a real game — honest rules, honest grading, real
progress — and that is precisely what makes the descent land. Three axes of
comedy, in order:

- **A skill game you can win.** Tiers I–III reward attention. The rules are
  subtle (a crosswalk showing DON'T WALK doesn't count; a shuttle is not a bus;
  a parked bus is furniture), never stated, and taught by a hint when you miss.
- **A wall that cheats.** Tier IV takes back the clinching win, politely, every
  time, and never with the same excuse twice.
- **Impossible / meta / honeypot.** Once it reclassifies you, the instructions
  stop being satisfiable, the widget stops trusting you, and it apes the
  phishing-y "just enter a code from any card" move — then refuses and mocks
  anyone (or any bot) that complies. Nothing is ever collected. The joke *is*
  the refusal.

The through-line: **you can win rounds, but you can never win.**

## 2. Tone & voice

Deadpan bureaucratic menace with a customer-service smile. The widget is always
polite, always official-looking, and always wrong about you. Think "HR chatbot
that has decided you specifically are a threat." Verdicts are short, quotable,
and escalate in confidence even as the logic collapses.

## 3. The core loop — tiers you graduate, until the wall

The game is a ladder of difficulty **tiers**. Each tier is a *pool* of
challenges; the app picks one at **random** each round. Clear **3 in a row** to
**graduate** to the next tier.

- **Tier I — Basic** (3×3, static): one clear rule at a time. Genuinely winnable.
- **Tier II — Enhanced** (4×4, static): denser near-miss traps, spatial nuance.
- **Tier III — Advanced** (5×5, dynamic): lights start **changing on a timer**.
- **Tier IV — Adversarial** (6×6, fast dynamic, compound rules): **the wall.**
- **Tier V — █████** (locked): *"no verified human has ever seen Tier V."*

Tiers I–III are real skill and really graduate. **Tier IV is rigged:** it steals
the clinching 3rd win every time (the rule flips the instant you commit → a red
light turns green a half-second before Verify → "verification refreshed, your
2-of-3 couldn't be carried over" → your streak is backdated to before it began →
the goalpost moves to 4-in-a-row). After it robs you `RIG_LIMIT` times it
**reclassifies you as non-human** and grants forced entry to **Tier V** — which
is how you finally reach the absurd/meta/honeypot finale and the robot
certificate. So "no human sees Tier V" stays true: you only see it *because* it
decided you're a bot.

**Nuanced rules (the gotchas).** Every tile has hidden attributes; the rule reads
them — learnable but never spelled out:

- *Crosswalk:* counts — **unless it shows a red DON'T WALK hand.**
- *Traffic light:* only a **RED** light counts; green/yellow are traps.
- *Bus:* a full-size bus counts; a **shuttle van** does not.
- *Bus, moving:* a **parked** bus is furniture; only motion counts.
- *Hydrant:* only hydrants standing to the **LEFT of their pole**.
- *Crosswalk, clear:* walkable **and** with no vehicle stopped on it.
- *Compound (Tier IV):* "every RED light **and** every walkable crosswalk."

**Dynamic, timed tiles (III+).** Lights **change on a timer** (red⇄green, out of
phase; faster each tier). A light must still be red **the instant you press
Verify** — evaluation reads the *live* tile state, so it's genuinely a timing
test. A rising **bot-probability %** underscores that you're losing ground.

## 4. Round taxonomy (the content engine)

Two systems, both data-driven:

- **Image gameplay (Tiers I–IV)** — configured, not hand-authored. `tiles.js`
  defines tile categories + hidden attributes and their placeholder art;
  `rules.js` defines each rule's prompt, `test(live)` predicate, post-fail hint,
  and near-miss traps; `tiers.js` defines the tiers (roman name, grid size,
  dynamic speed, rigged flag, and the **rule pool** picked from at random);
  `engine.js` generates each grid, evaluates for real, and runs the
  graduation/steal/reclassify logic. Add a rule, a trap, or a tier = a few lines
  of data.
- **Tier V — the absurd tail** — hand-authored round objects in `rounds.js`
  (`emoji-grid`, `canvas-scene`, `text-challenge`) carrying `prompt`, `sub`,
  `sabotage[]`, and a `verdict`. Where the best jokes live (childhood crosswalks,
  the taste of blue, the honeypot card code, the LLM appeal, the finale). **Text
  input is never stored or sent.** The tail plays the arc's acts 2 and 3; act 1's
  "this seems normal" warm-ups are retired, because tiers I–IV now do that job
  for real and replaying them would walk the joke backwards.

## 4a. Art & the image pipeline

Tiles render as **concept-accurate placeholder art** (CSS): striped crosswalks
with WALK/DON'T-WALK badges, three-lamp traffic lights, a visible pole so "left
of the pole" is legible, speed lines for vehicles in motion, emoji decoys — so
every rule is testable with zero assets. To go photorealistic, generate a
labelled image pack and register URLs in `images.manifest.js`; a tile then gains
a `src` and `ImageGrid` renders the `<img>` instead of the placeholder. Rules and
engine are untouched. Dynamic lights need a matched red/green pair of the same
pole so they can cross-fade — `validateManifest()` enforces that, along with a
prompt→file record for every image, because a mislabeled image silently breaks a
rule and that is the one bug a fair tier cannot survive.

## 5. Sabotage catalog

UI behaviors the engine layers onto **Tier V** rounds. The tiers stay clean —
they have to be fair — so these are the tail's toys. Mix freely; stack more per
round as you go deeper.

- **regenerate** — clicking a tile morphs a *different* tile (the infamous "a new
  one faded in" loop), making "none left" unreachable.
- **reshuffle** — tiles swap positions on each click, sliding your careful
  selection out from under you.
- **drift** — the whole grid/scene slowly wanders.
- **shrink** — tiles shrink the longer you deliberate.
- **wiggle** — tiles jitter.
- **fade-prompt** — the instruction fades out as you read it.
- **fake-timer** — a meaningless countdown that resets forever.
- **cursor-lag** — a decoy cursor that trails behind the real pointer.
- **dodge** — tiles flee from the pointer as it approaches.
- **fake-select-all** — a "select all" helper that betrays you (selects, then drops).
- **reverse-slider** — a slide-to-verify handle that runs backwards and resets
  before it can finish (`SliderCaptcha`, frame-level, opt-in per round).
- **select-all-verify** — a "Select all" checkbox that selects the Verify button
  instead of any tiles (frame-level, opt-in per round).

Roadmap ideas: a cursor that snaps to the wrong tile on release; accessibility
mode that is somehow *more* absurd, not less.

## 6. The honeypot / scammer-tarpit angle (with guardrails)

The bit lands *because* it dangles the phishing move and then pulls it away. Hard
rules that keep it a joke and not an actual liability:

- **No collection, ever.** Text inputs live in ephemeral component state and are
  discarded. No network calls, no storage, no analytics of answer content.
- **Explicit on-screen note** on any input: nothing is saved or sent; don't type
  real card numbers even ironically.
- **The punchline is refusal**: entering "sensitive" data gets you *declined and
  mocked* ("a real human would never actually type that"), never accepted.
- Framed as wasting a scammer's/bot's time (a tarpit), not extracting anything.

## 7. Tech

- **React + Vite** (chosen). Zero backend — it's a pure client app; deploy the
  `dist/` folder to any static host (GitHub Pages, Netlify, Cloudflare Pages).
- **Rendering:** concept-accurate CSS placeholder art for the image tiles
  (swappable for generated images via `images.manifest.js`), emoji + CSS for
  the absurd tail, `<canvas>` for the dense Waldo scenes and the certificate PNG.
- `base: './'` in Vite config so the build runs from any subpath or `file://`.
- No browser storage APIs required for core play. No runtime dependencies beyond
  React.
- **Effect gotcha:** any `useEffect` reporting state upward must use a block body
  — never `useEffect(() => onChange(x))`, which returns `x` as a bogus cleanup
  function and blanks the app.

## 8. Invariants (enforced by `npm run verify`)

1. **You can graduate I–III, but never truly win.** Tier IV is rigged and never
   graduates; after `RIG_LIMIT` thefts you're reclassified into Tier V. Tier V
   never resolves to a "pass." The footer bot-probability only rises.
2. **Tiers I–IV are genuinely solvable and fair-feeling.** `evaluate()` stays
   honest in both directions — a perfect answer always passes, a wrong one never
   does. Only the Tier IV *streak* is rigged. Rules are learnable and a post-fail
   hint teaches them.
3. **Every generated tile signature has a manifest slot**, and no slot is dead —
   so an image pack can't mislabel a rule.
4. **Nothing is stored or transmitted.**
5. **Mobile-playable**, even while sabotaged/timed.

## 9. Milestones

1. **Absurd tail + sabotage + certificate — DONE** — hand-authored meta/honeypot
   rounds, twelve sabotage behaviors, five canvas scenes, sound, landing screen,
   evolving chrome, and the shareable robot certificate with a canvas-rendered
   PNG download (dev panel auto-stripped from prod builds).
2. **Tiered skill loop — DONE** — attribute-based tiles, nuanced rules incl. two
   compound rules, and a four-rung ladder: I–III graduatable, IV the rigged wall,
   V reclassify-only.
3. **Merge — DONE** — one game: the ladder in front, the tail behind, chrome
   escalating across both, invariants under test.
4. **Image pipeline — SCAFFOLDED** — manifest, generation brief, validator and
   placeholder fallback all in place. **Remaining:** generate the pack.

## 10. Non-goals / guardrails

- Not a real CAPTCHA, not real security, collects nothing.
- No dark-pattern data capture — the honeypot is a *bit*, enforced by "we store
  nothing" being literally true in code.
- Keep it playable on mobile (tap targets, viewport) even while sabotaged.
- Never rig `evaluate()`. The comedy is the theft at the wall; a dishonest grader
  would just feel broken.

## 11. Stretch ideas

- A "score" that is just how long you tolerated it; leaderboard of futility.
- Achievements ("Typed a real word," "Rage-clicked Verify 10×").
- Accessibility mode that is somehow *more* absurd, not less.
- A tier between III and IV — deliberately **not** taken: a fifth rung collides
  with "Tier V, which no verified human has ever seen," and the name is worth
  more than the difficulty curve.
