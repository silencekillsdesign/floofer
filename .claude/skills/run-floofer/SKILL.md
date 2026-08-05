---
name: run-floofer
description: Build, run, and drive the Floofer app. Use when asked to start floofer, run the dev server, take a screenshot of the UI, drive or interact with the running app, or run its tests.
---

Floofer is a Nuxt 3 web app (see `CLAUDE.md`). Headless, you drive it by
starting the dev server and piping commands to
`.claude/skills/run-floofer/driver.mjs` — a small Playwright-Chromium REPL
that navigates, clicks, and screenshots. All paths are relative to the
repo root.

## Prerequisites

Node 22 + npm (present in the standard container). Chromium comes from
the container's Playwright install (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`)
— do **not** run `playwright install`. The driver needs `playwright-core`,
which is a committed devDependency.

## Setup

```bash
npm install
```

No env vars needed — demo mode (no backend) is the product's baseline and
everything below works with zero configuration.

## Run (agent path)

Start the dev server in the background and poll the port (first compile
takes ~15s; don't use a fixed sleep):

```bash
npm run dev > /tmp/floofer-dev.log 2>&1 &
timeout 90 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Drive it. This exact script exercises the core flow — dismiss the
first-run wizard, like the top at-risk dog, verify it lands in Matches:

```bash
node .claude/skills/run-floofer/driver.mjs <<'EOF'
nav http://localhost:3000
eval localStorage.setItem('rescue-match-v1', JSON.stringify({profile:{onboardedAt:'2026-01-01T00:00:00.000Z'}}))
nav http://localhost:3000
wait [aria-label^="Like "]
ss deck
click [aria-label^="Like "]
waitfn (JSON.parse(localStorage.getItem('rescue-match-v1')||'{}').liked||[]).length > 0
nav http://localhost:3000/matches
wait text=Bruno
ss matches
errors
quit
EOF
```

Screenshots land in `/tmp/floofer-shots/<name>.png`. **Look at them** —
the 420×850 viewport is deliberate (the app is mobile-first).

Driver commands (one per line on stdin; `|` separates fill args):

| command | what it does |
|---|---|
| `nav <url>` | goto, waits for domcontentloaded |
| `wait <selector>` | wait for any Playwright selector (incl. `text=…`) |
| `waitfn <js-expr>` | wait until a page-side JS expression is truthy |
| `click <selector>` / `press <key>` | act |
| `fill <selector>\|<value>` | fill an input |
| `ss [name]` | screenshot → `/tmp/floofer-shots/` |
| `eval <js-expr>` | evaluate in page, print JSON result |
| `errors` | print collected console/page errors |
| `quit` | close browser, exit 0 |

Shareable pet pages are SSR'd and reachable directly — `nav
http://localhost:3000/pet/bruno` renders without any prior state.

Stop the server by killing the port's listener (npm doesn't forward
signals to the Nuxt child, so `$!` won't do it):

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill
```

## Run (human path)

```bash
npm run dev   # → http://localhost:3000, Ctrl-C to stop
```

Useless headless — it just serves; use the driver above.

## Test

```bash
npm test      # vitest run — 4 files, 85 tests, all pass in <1s
```

## Gotchas

- **First-run onboarding wizard covers the deck.** A fresh profile
  (`profile.onboardedAt` unset) gets a full-screen 6-step wizard on `/`.
  The deck is behind it. Seed `localStorage['rescue-match-v1']` with
  `{profile:{onboardedAt:'<iso>'}}` and reload (as in the script above)
  instead of clicking through six steps.
- **Likes persist a beat *after* the click.** The card fly-off animation
  delays the state commit, so `nav`-ing immediately after `click` on the
  like button loses the like (Matches shows 0). `waitfn` on the
  localStorage key before navigating — that's what the flow above does.
- **The deck stacks cards in the DOM.** `document.querySelector('h2')`
  can return a *background* card's name. The reliable top-card handle is
  the decide-buttons' aria-labels: `[aria-label^="Like "]` /
  `[aria-label^="Pass on "]` — their value names the current dog.
- **Dog photos 403/reset in this container.** `images.dog.ceo` is blocked
  by the egress proxy, so demo photos fall back to the emoji placeholder
  and `errors` reports 403s from `/_ipx/...`. Harmless — don't chase it.
  (Google Fonts *is* reachable, so typography renders correctly.)
- **Demo deck order:** the top card is the highest-risk dog with the
  fewest days left — `bruno` (5 days) as of the seed data. If seed
  data changes, key waits off `[aria-label^="Like "]`, not a name.

## Troubleshooting

- **`EADDRINUSE: address already in use :3000`**: a previous dev server
  is still holding the port. `lsof -ti:3000 -sTCP:LISTEN | xargs -r kill`
  and relaunch.
- **Driver exits with a Chromium "Executable doesn't exist" error**: the
  installed `playwright-core` revision doesn't match the container's
  browsers. The driver already falls back to
  `/opt/pw-browsers/chromium`; if that symlink is missing too, the
  container image is nonstandard — check `ls /opt/pw-browsers`.
