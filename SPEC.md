# hCROSSWALK™ — Design Spec

> A standalone web game that impersonates a "select all crosswalks" CAPTCHA and
> descends, round by round, into total absurdity. You never prove you're human.
> The machine grows ever more certain that **you** are the bot.

**Status: fully implemented and shipped.** All milestones below are built and the
build is verified: a landing screen, evolving widget chrome (captcha → form →
terms-of-service → summons), **40 authored rounds**, **12 sabotage mechanics**,
**5 canvas scenes**, sound, and a robot-certificate end-card with a downloadable
PNG. Milestones §8 are kept as a record of how the arc was built.

---

## 1. Concept

A pixel-perfect-ish parody of the reCAPTCHA / hCaptcha "prove you aren't a robot"
image challenge. It starts looking almost legitimate ("select all crosswalks"),
then escalates every round through three axes of comedy:

- **Impossible instructions** — the task becomes unsatisfiable ("select all
  crosswalks that are thinking about their childhood").
- **Meta / fourth-wall** — the widget stops trusting *you*, demands increasingly
  personal "proof," and interprets every answer as bot-like.
- **Honeypot / scammer-tarpit framing** — it apes the phishing-y "just enter a
  code from any card" move, then refuses and mocks anyone (or any bot) that
  actually complies. Nothing is ever collected. The joke *is* the refusal.

The through-line: **there is no winning.** Every "Verify" click escalates. The
fun is in how creatively the machine insults the player's humanity.

## 2. Tone & voice

Deadpan bureaucratic menace with a customer-service smile. The widget is always
polite, always official-looking, and always wrong about you. Think "HR chatbot
that has decided you specifically are a threat." Verdicts are short, quotable,
and escalate in confidence even as the logic collapses.

## 3. The escalation model (three acts)

| Act | Feel | Rounds do this |
|-----|------|----------------|
| **I — Seems normal** | mildly annoying, familiar | real-ish grids, one twist (the "one more appeared" gag) |
| **II — Getting unfair** | UI fights back | sabotage mechanics: drift, shrink, reshuffle, regenerate, fake timer |
| **III — Impossible / meta / honeypot** | reality breaks | unsatisfiable prompts, accusations, fake "verification" of personal info |
| **∞ — Procedural** | endless | generator keeps inventing rounds so it literally never ends |

"Difficulty" is a **cosmetic lie** — labels climb from *Verification* →
*Verification (paranoid)* → *Verification (why are you still here)*. A fake
**bot-probability %** in the footer only ever rises, no matter what you do.

## 4. Round taxonomy (the content engine)

Everything is data-driven — a round is just an object, so writing new absurdity
is a content task, not a code task. Three render kinds today:

- **`emoji-grid`** — classic NxN tile grid built from emoji + CSS. Cheap,
  offline, and the crude look is part of the joke. Used for Acts I & III.
- **`canvas-scene`** — a "Where's Waldo" procedural intersection drawn on
  `<canvas>`, dense with tiny crosswalk clusters you can never satisfy. This is
  the seam where richer, busier scenes get swapped in as absurdity ramps.
- **`text-challenge`** — free-text "prove your humanity" prompts (describe the
  taste of blue; the honeypot card-code gag). **Input is never stored or sent.**

Each round carries: `prompt`, `sub`, render config, a `sabotage[]` list, and a
`verdict` (the escalating put-down). See `src/game/rounds.js` for the live model.

## 5. Sabotage catalog

UI behaviors the engine layers onto any round. Mix freely; stack more per round
as you go deeper.

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
- **Rendering:** emoji + CSS/SVG early, `<canvas>` for the dense Waldo scenes —
  a deliberate "emoji now, canvas later" ramp matching the escalation.
- `base: './'` in Vite config so the build runs from any subpath or `file://`.
- No browser storage APIs required for core play.

## 8. Milestones

1. **Scaffold — DONE** — engine, data model, sabotage mechanics, procedural
   fallback, dev round-jumper.
2. **Content depth — DONE** — 24 authored rounds across all three acts; each
   `verdict` is a distinct escalating put-down.
3. **Sabotage mechanics — DONE** — regenerate, reshuffle, drift, shrink, wiggle,
   fade-prompt, fake-timer, plus cursor-lag, dodge (tiles flee), and a
   fake-"Select all" that betrays you.
4. **Canvas scenes — DONE** — three density-escalating scenes (`intersection`,
   `market`, `mirrors`) with deliberately-wrong hit detection ("verified: 0").
5. **Juice — DONE** — round-enter transitions, mute-by-default synthesized sound,
   and a shareable robot-certificate end-card (native share + copy-taunt
   fallback + downloadable PNG rendered on canvas). Dev panel is auto-stripped
   from production builds.
6. **Ship — DONE** — landing framing, evolving chrome, and a static `dist/`
   verified to serve from any host (`base: './'`). See README "Deploy".

## 9. Stretch ideas

- A "score" that is just how long you tolerated it; leaderboard of futility.
- Escalating *widget chrome*: it slowly stops looking like a captcha and starts
  looking like a form, a terms-of-service, a court summons.
- Achievements ("Typed a real word," "Rage-clicked Verify 10×").
- Accessibility mode that is somehow *more* absurd, not less.

## 10. Non-goals / guardrails

- Not a real CAPTCHA, not real security, collects nothing.
- No dark-pattern data capture — the honeypot is a *bit*, enforced by "we store
  nothing" being literally true in code.
- Keep it playable on mobile (tap targets, viewport) even while sabotaged.
