# hUMAN™ 🤖🚸

A CAPTCHA you can *almost* win. It impersonates the "select all crosswalks" bot
check, gives you a real, learnable skill game for three tiers — and then, at the
wall, starts taking your wins back. You never graduate Tier IV. Eventually the
machine gives up on you, reclassifies you as non-human, and lets you into Tier V,
which no verified human has ever seen. Being let in is not a compliment.

Built as a **scammer/bot tarpit** gag: it dangles the phishing-y "just enter a
code" move and then refuses and mocks anyone who complies. **Nothing is ever
stored or sent** — the honeypot is a bit, not a data grab.

## Run it

```bash
npm install
npm run dev      # play at the printed localhost URL
npm run build    # produces static dist/ — deploy anywhere
npm run preview  # serve the built dist/ locally to sanity-check
npm run verify   # headless check that the game still plays the way it claims
```

Use the **dev panel** (bottom-left, dev builds only) to jump tiers, bump the
streak, or skip straight to Tier V.

## The shape of it

**Tiers I–III are genuinely winnable.** Each tier is a pool of rules; you get a
random one each round and must clear **3 in a row** to graduate. The rules are
subtle but fair, and a post-fail hint teaches the one you just missed:

| | |
|---|---|
| **I — Basic** (3×3) | crosswalks (a red DON'T WALK hand doesn't count), red lights, buses (a shuttle van is not a bus) |
| **II — Enhanced** (4×4) | denser traps, plus hydrants standing *left* of their pole |
| **III — Advanced** (5×5) | lights now change on a timer — a light must still be red the instant you press Verify — plus buses that are *actually moving* |
| **IV — Adversarial** (6×6) | fast timers and compound rules. **The wall.** |
| **V — █████** | locked. See below. |

**Tier IV is rigged.** Evaluation stays honest everywhere — the grader never
lies — but the clinching third win is stolen every time, and never the same way
twice (the rule flips, a light changes a half-second early, verification
"refreshes", your streak is administratively backdated to before it began). After
three thefts the system stops arguing and reclassifies you as non-human, which is
the only way anyone reaches **Tier V**: 32 authored rounds of impossible, meta
and honeypot absurdity, then endless procedural rounds, then a certificate
declaring you a robot.

## What's here

- `src/game/tiles.js` — tiles as **hidden attributes** (signal state, live light
  colour, moving/parked, which side of the pole), not pictures. Rules read the
  attributes, so nuance is data.
- `src/game/rules.js` — each rule's prompt, `test(live)` predicate, post-fail
  hint and near-miss traps.
- `src/game/tiers.js` — the ladder: grid size, timer cadence, rigged flag, rule
  pool, and `RIG_LIMIT`.
- `src/game/engine.js` — grid generation, **honest** evaluation, graduation, the
  steal variants, reclassification, **evolving chrome** (captcha → form →
  terms-of-service → court summons), and the procedural generator.
- `src/game/rounds.js` — the authored absurd tail + the `SABOTAGE` keys.
- `src/game/images.manifest.js` — attribute→image map, generation brief, and
  `validateManifest()` so a generated pack can't silently mislabel a rule.
- `src/components/` — `ImageGrid` (tile art + timed lights), `Grid`,
  `CanvasScene` (five Waldo scenes), `TextChallenge`, `SliderCaptcha`,
  `CaptchaFrame` (mutating chrome), `EndCard` (certificate + downloadable PNG).
- **12 sabotage mechanics** the tail can layer on — drift, reshuffle, regenerate,
  dodge, cursor lag, a slider that runs backwards, a "Select all" checkbox that
  selects the Verify button. The tiers stay clean; sabotage is Tier V's job.
- `SPEC.md` — full design spec. `npm run verify` enforces the invariants.

Tiles render as **concept-accurate placeholder art** (CSS zebra stripes, lamp
housings, a visible pole so "left of the pole" is legible). To go photorealistic,
generate a labelled pack, drop it in `public/img/`, and register the URLs in
`images.manifest.js` — no rule or engine changes.

## Deploy

It's a pure static app (Vite `base: './'`, so it runs from any subpath or
`file://`). Run `npm run build` and publish the resulting `dist/` folder to any
static host: on **GitHub Pages**, push and either drop `dist/` on a `gh-pages`
branch or point a Pages Action at it (the relative base means it works under
`/<repo>/` with no config); on **Netlify**, set build command `npm run build`
and publish directory `dist`; on **Cloudflare Pages**, connect the repo with
framework preset *None*, build command `npm run build`, and output directory
`dist`. No environment variables, no backend, no server routes — every host
above serves the same three files (`index.html` + one JS + one CSS).

## Guardrails

Pure client-side, collects nothing, no storage or network calls for gameplay.
Tiers I–IV are graded honestly — the comedy is the theft at the wall, not a
dishonest grader. See SPEC.md §6 and §10.
