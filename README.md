# hCROSSWALK™ 🤖🚸

An increasingly absurd CAPTCHA joke game. It impersonates the "select all
crosswalks" bot check and escalates, round by round, until the machine is fully
convinced that *you* are the robot. You never pass. That's the point.

Built as a **scammer/bot tarpit** gag: it dangles the phishing-y "just enter a
code" move and then refuses and mocks anyone who complies. **Nothing is ever
stored or sent** — the honeypot is a bit, not a data grab.

## Run it

```bash
npm install
npm run dev      # play at the printed localhost URL
npm run build    # produces static dist/ — deploy anywhere
npm run preview  # serve the built dist/ locally to sanity-check
```

Use the **dev panel** (bottom-left, dev builds only) to jump between rounds.

## What's here (fully built)

- A short **landing screen** ("Verifying your connection…") that always clears
  and drops you into round 1 — the only verification in the game that passes,
  and it isn't even about you.
- `src/game/rounds.js` — data-driven round model + **40 authored rounds** across
  three acts (seems-normal → unfair → impossible/meta/honeypot), then endless
  procedural rounds.
- `src/game/engine.js` — escalation engine (never returns a pass), **evolving
  chrome** that mutates the widget act-by-act (captcha → form → terms-of-service
  → court summons), and `makeProceduralRound`.
- `src/game/sound.js` — synthesized, mute-by-default blips (no asset files).
- `src/components/` — `Grid` (emoji + sabotage), `CanvasScene` (five
  density-escalating Waldo scenes), `TextChallenge` (honeypot text prompts),
  `SliderCaptcha` (a slide-to-verify handle that runs backwards), `CaptchaFrame`
  (the mutating chrome), `EndCard` (robot certificate + downloadable PNG).
- **12 sabotage mechanics**, each a `SABOTAGE` key any round can opt into —
  including a slider that runs backwards and a "Select all" checkbox that
  selects the Verify button.
- `SPEC.md` — full design spec and parameters.

Reaching the final authored round issues you an official certificate declaring
you a robot, which you can share, copy as a taunt, or **download as a PNG**.
"Continue anyway ∞" drops into the endless procedural rounds.

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
See SPEC.md §6 and §10.
