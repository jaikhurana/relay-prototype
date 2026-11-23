# Relay

Relay is a time zone coordination feature for workplace chat. Teams in Bangalore, London and New York share no working hour, so every missed hand-off costs a day or an evening.
Relay "passes the baton": complete off-hours asks, a sorted morning queue, a log-off nudge, and recorded Relay meetings with a Fair Turn for calls that must be live.
This repo is a clickable prototype (Media.net APM case): a realistic chat app window driven by one simulated clock, plus a scripted "Watch demo".

## Run

```bash
npm i
npm run dev
```

Open http://localhost:5173/. Best at 1280 px wide or more.

## Test

```bash
npm test
npx playwright test
```

- `npm test`: Vitest unit tests for the pure logic in `src/logic` (time maths, queue, nudge, relay, Fair Turn, DST).
- `npx playwright test`: builds, serves the production build on port 4173, then runs the e2e suite (full demo at 4×, stepper order independence, the "prompts only when offline" rule, copy checks) and writes screenshots of every step × view to `screenshots/`.
  If Playwright has no browser yet, run `npx playwright install chromium` once.

## Deploy

Push the repo to GitHub, then in Vercel choose **Import project**, framework **Vite**, no environment variables. It is a static build (`dist/`) with a single route `/`.

## Demo links

- `/?demo=1` (or `/#demo`) autoplays the scripted demo (about 2.5 minutes).
- `/?demo=1&speed=1.5` plays faster; `/?demo=1&speed=4` is what the tests use.
- Keys while the demo plays: Space pause/play, ← → previous/next chapter, Esc exit. Clicking the app pauses.

## How it works

- Everything reads one simulated clock (`store.simTime`, a UTC ISO string). Time zone maths uses luxon with IANA zones, never fixed offsets.
- `src/data/scenario.ts` holds the people, asks, meetings, monthly Fair Turn counts, the 7 story beats, and a little ambient channel activity (messages and reactions) so the host app feels lived-in.
- The host app ("Workspace") uses familiar work-chat conventions (labelled icon rail, top search, navy sidebar, unread counts, date dividers, hover reactions) without copying any real product's logo, name or colours. Magenta appears only on Relay elements.
- `src/logic/*` is pure TypeScript with no React: `isWorking`, `nextWorkStart`, `workEnd`, `rankQueue`, `nudgeFor`, `needsRelay`, `fairTurn`.
- `src/state/store.ts` (zustand) has `beatScene(n)`, which returns the full state for each beat, so stepper jumps are instant and order-independent.
- `src/demo/` drives the real UI: the cursor glides to `[data-demo="…"]` targets, types into the real inputs and clicks the real buttons.

No backend, no network calls, no login, no analytics, no localStorage.
