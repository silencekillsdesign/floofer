# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Floofer is a Tinder-style pet adoption app that surfaces dogs at the highest
risk of euthanization first. Nuxt 3 · Vue 3 · Tailwind CSS · Leaflet ·
Supabase (optional backend). Deployed to Netlify; `/api/*` routes become
serverless functions via Nitro's auto-detected preset.

## Commands

```bash
npm run dev                          # dev server (http://localhost:3000)
npm run build                        # production build
npm test                             # vitest run — all tests
npm run test:watch                   # vitest watch mode
npx vitest run test/matching.spec.ts # single test file

npm run seed:org                     # invite a shelter org (needs SUPABASE_SERVICE_KEY)
npm run login:link -- --email x@y.z  # print a magic sign-in link (local dev only)
```

There is no linter configured. Tests are pure-logic specs in `test/` running in
a plain node environment (no Nuxt runtime) — `vitest.config.ts` only supplies
the `~` alias and pins `TZ=America/Chicago`. The TZ pin is deliberate: the
risk-deadline tests must mean the same thing on any machine. Don't remove it.

## Core architectural rule: the app runs with no backend

Demo mode is the product's baseline, not a degraded state. The demo deck,
shareable pet pages, and every flow must work with zero configuration.
Consequences:

- **`useDb().configured` is the single gate to Supabase** (`composables/useDb.ts`).
  `nuxt.config.ts` falls back to a `localhost:54321` placeholder URL so the
  Supabase client constructs harmlessly; `configured` detects that placeholder.
  Nothing may call Supabase without checking it first — `fetchDogs()` etc.
  return `[]`/no-ops when unconfigured so callers fall back to demo data.
- **Features degrade honestly.** If email isn't configured, `/api/notify`
  reports `delivered: false` and the UI says so — never show success for
  something that didn't happen. Follow this pattern for new integrations.

## Data flow

Four data sources (`DataSource` in `composables/useStore.ts`):
`demo` (seed data in `data/dogs.ts`), `floofer` (own Supabase DB — the only
source where a risk countdown is shelter-set and real), `rescuegroups`, and
`petfinder`. The aggregators go through Nitro proxies
(`server/api/animals.get.ts`, `server/api/petfinder.get.ts`) that keep API keys
server-side; the floofer source queries Supabase directly from the client with
RLS doing the filtering. On load failure the deck falls back to demo dogs so
the app never goes empty.

Every source is normalized to the one `Dog` shape (`types/index.ts`).
`utils/dogMapper.ts` is the **single translation point** from DB rows —
components never learn a second data source exists. `types/db.ts` is a
hand-written mirror of `supabase/migrations/*.sql`; keep them in sync when
touching the schema (it can be regenerated with
`npx supabase gen types typescript --linked` once a project is linked).

## State

`useStore()` (`composables/useStore.ts`) is the single reactive store, built on
Nuxt `useState` and hydrated once on the client:

- Small/hot state (likes, passes, profile, filters) → `localStorage`
  (`rescue-match-v1`), stripped of inline images.
- Base64 photos (blow past the localStorage quota) → IndexedDB via `idb-keyval`,
  merged in a tick after first paint.
- A deep watcher persists everything; `suspendPersist` pauses it during
  `clearMyData()` so a deletion isn't resurrected by its own write-back.
- Old persisted shapes are carried forward by `migrateProfile()` — add a
  migration there when changing the `Profile` shape rather than breaking saves.

The whole UI reads identity (`userType`, name, org) from this local profile.
`plugins/auth-sync.client.ts` bridges Supabase auth into it on sign-in/out —
that's what makes a signed-in shelter see shelter tools. Local-only fields
(payment, photos, documents) are never overwritten by the sync.

Pentagon matching (`scoreMatch`), filters (`applyFilters`), and geo helpers
also live in `useStore.ts` and are what the pure tests cover.

## Server routes

- `server/api/animals.get.ts` / `petfinder.get.ts` — aggregator proxies +
  adapters. Clear `createError` messages when keys are missing/rejected.
- `server/api/notify.post.ts` — adopter→shelter email via Resend. **The
  recipient is always looked up from the listing, never taken from the
  request** (otherwise it's an open relay). Rate-limited in-memory.
- Secrets live in `runtimeConfig` (set via `NUXT_*` env vars, see
  `.env.example`); only `runtimeConfig.public` reaches the client.

## Supabase

Migrations in `supabase/migrations/` (apply with `npx supabase db push`).
Every table has RLS; the pilot is invite-only (`org_invites` +
`handle_new_user()` attach a new user to their org on first sign-in).
Security posture: server-derived over client-supplied — e.g. `org_id` and
`created_by` on listings come from the caller's own profile row, never from
the form. `SUPABASE_SERVICE_KEY` is for local scripts only.

## Dates and timezones

This codebase is fussy about calendar dates because euthanasia countdowns must
not depend on where they're read:

- `daysUntil()` (`utils/dogMapper.ts`) compares UTC midnights on both sides.
- Never use `toISOString()` to get a calendar date — it rolls the day over in
  the evening west of Greenwich. Use `todayLocalISO()` / `localDate()`.
- Play dates use day parts ("Saturday morning"), not exact times, on purpose.

## UI conventions

- Components auto-import with **no path prefix** (`nuxt.config.ts`): folders
  (`ui/`, `match/`, `pet/`, `account/`) are for humans only, so
  `components/match/MatchDeck.vue` is `<MatchDeck>`, not `<MatchMatchDeck>`.
- Theming: CSS custom properties (RGB triplets) in `assets/css/main.css`,
  mapped to Tailwind colors in `tailwind.config.ts` via `rgb(var(--c-*))`.
  Dark is the default; light mode is a `.light` class on `<html>`, applied
  pre-paint by an inline head script to avoid a flash. Use the semantic tokens
  (`bg-paper`, `text-ink`, `border-line`, `bg-card`, `risk`, `safe`) — never
  hard-coded colors.
- Reka UI provides unstyled a11y primitives (dialogs, popovers, combobox);
  Tailwind tokens carry the look.
- SSR is on (shareable/indexable pet pages need it). Anything driven by
  localStorage must be wrapped in `<ClientOnly>` or gated on the store's
  `hydrated` flag to keep hydration clean.
- `design/figma-library.md` is the Figma design-system spec extracted from
  code. Code wins when they disagree; update the doc when changing tokens or
  the shared `ui/`/`match/` components.

## Domain vocabulary that matters

- `municipal` (open-admission animal control — euthanizes for space) vs
  `shelter` (limited-admission / no-kill) are deliberately distinct source
  types. Don't merge them; the distinction is the point of the app.
- `risk: "high"` dogs always surface first in the deck, sorted by days
  remaining. Risk *categories* (`data/riskCategories.ts`) describe *why* a dog
  is at risk and are filterable.
- Fast-Pass (`utils/fastPass.ts`) = pre-verified adopters dispatchable during
  an emergency; play dates (`utils/playDates.ts`) = meet-and-greet scheduling.

## Code style

Comments in this codebase explain *why* — constraints, failure modes the code
guards against, and deliberate product decisions — not what the next line
does. Match that density and register when editing.
