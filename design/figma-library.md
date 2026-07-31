# Floofer → Figma component library

Source of truth for building (and rebuilding) the Floofer design system in Figma
via the Figma MCP. Everything here is extracted from code — when this file and
the code disagree, the code wins and this file is stale.

- Code tokens: [`assets/css/main.css`](../assets/css/main.css) (CSS custom properties, RGB triplets)
- Tailwind mapping: [`tailwind.config.ts`](../tailwind.config.ts)
- Components: [`components/ui/`](../components/ui/), [`components/match/`](../components/match/)

Figma file: **Floofer Design System** (SilenceKillsDesign team). Variables carry
`WEB` code syntax matching the real CSS vars, so Dev Mode round-trips to code.

---

## 1. Color tokens

One collection **`Color`**, two modes — **Dark** (product default) and **Light**.
No primitive layer: code has none, and inventing one in Figma would create a
mapping that doesn't exist anywhere else.

| Token | Dark | Light | Scopes | Code syntax |
|---|---|---|---|---|
| `paper` | `#000000` | `#F7F8FB` | frame/shape fill | `var(--c-paper)` |
| `paper-warm` | `#0E0E13` | `#ECEEF5` | frame/shape fill | `var(--c-paper-warm)` |
| `card` | `#15151C` | `#FFFFFF` | frame/shape fill | `var(--c-card)` |
| `line` | `#262633` | `#E2E5EE` | stroke + fills | `var(--c-line)` |
| `ink` | `#F2F3F7` | `#171921` | text, icon | `var(--c-ink)` |
| `ink-soft` | `#A7ACBB` | `#5A6172` | text, icon | `var(--c-ink-soft)` |
| `ink-faint` | `#646B7A` | `#9AA1B0` | text, icon | `var(--c-ink-faint)` |
| `brand` | `#5A6CEC` | `#4C5FE4` | all | `var(--c-brand)` |
| `brand-deep` | `#4252D6` | `#3A49C4` | all | `var(--c-brand-deep)` |
| `brand-soft` | `#1A1D40` | `#E8EAFD` | frame/shape fill | `var(--c-brand-soft)` |
| `pink` | `#F0326E` | `#E91E63` | all | `var(--c-pink)` |
| `pink-deep` | `#C91D55` | `#C2185B` | all | `var(--c-pink-deep)` |
| `grape` | `#7C3AED` | `#7C3AED` | all | `var(--c-grape)` |
| `navy` | `#232A7C` | `#232A7C` | all | `var(--c-navy)` |
| `risk` | `#FF4D42` | `#E0342C` | all | `var(--c-risk)` |
| `risk-soft` | `#2A1210` | `#FCE9E8` | frame/shape fill | `var(--c-risk-soft)` |
| `safe` | `#35D07F` | `#1A9E5C` | all | `var(--c-safe)` |
| `safe-soft` | `#0E2418` | `#E6F5EC` | frame/shape fill | `var(--c-safe-soft)` |
| `you` | `#F0326E` | `#E91E63` | all | `var(--c-you)` |
| `you-soft` | `#2B0F1B` | `#FCE4EC` | frame/shape fill | `var(--c-you-soft)` |

Notes carried from code comments:
- Dark-mode `brand` is lifted from the wordmark's `#4C5FE4` to `#5A6CEC` for
  AA contrast (4.8:1 on black); light mode runs the official value untouched.
- `paper-warm` sits *below* `card` so pills read as recessed against a card.
- `you`/`you-soft` = the adopter's own accents (map pins, self-markers).

## 2. Spacing & radius

Collection **`Layout`**, single mode. Values are px; code syntax is the
Tailwind utility (the codebase has no spacing CSS vars — Tailwind classes are
the real syntax).

| Token | px | Tailwind |
|---|---|---|
| `spacing/4` | 4 | `gap-1` / `p-1` |
| `spacing/6` | 6 | `gap-1.5` |
| `spacing/8` | 8 | `gap-2` / `p-2` |
| `spacing/10` | 10 | `gap-2.5` / `py-2.5` |
| `spacing/12` | 12 | `gap-3` / `p-3` |
| `spacing/16` | 16 | `gap-4` / `p-4` |
| `spacing/20` | 20 | `gap-5` / `p-5` |
| `spacing/24` | 24 | `gap-6` |
| `radius/lg` | 8 | `rounded-lg` |
| `radius/xl` | 12 | `rounded-xl` |
| `radius/2xl` | 16 | `rounded-2xl` |
| `radius/xl2` | 20 | `rounded-xl2` (custom) |
| `radius/3xl` | 24 | `rounded-3xl` |
| `radius/full` | 9999 | `rounded-full` |

## 3. Typography

Families: **Fredoka** (display — headings, dog names) and **Inter** (everything
else). Text styles, from actual usage:

| Style | Font | Size/Line | Used for |
|---|---|---|---|
| `Display/Page title` | Fredoka SemiBold | 24/32 | `h1`, `font-display text-2xl font-semibold` |
| `Display/Section` | Fredoka SemiBold | 18/28 | card `h2/h3`, `text-lg` |
| `Body/Default` | Inter Regular | 14/20 | `text-sm` body copy |
| `Body/Medium` | Inter Medium | 14/20 | `text-sm font-medium` inputs, notes |
| `Label/Semibold` | Inter Semi Bold | 14/20 | buttons, chips, rows |
| `Label/Bold` | Inter Bold | 14/20 | primary CTAs (`font-bold`) |
| `Caption/Medium` | Inter Medium | 12/16 | `text-xs` hints |
| `Caption/Overline` | Inter Semi Bold | 12/16, +0.5 tracking, uppercase | field labels (`uppercase tracking-wide`) |
| `Caption/Tiny` | Inter Medium | 11/15 | `text-[11px]` footnotes |

## 4. Effects

From `--sh-*` (dark values; light variants exist in code but Figma effect
styles are single-valued — dark is the product default):

| Style | CSS |
|---|---|
| `Shadow/Card` | `0 4px 16px rgba(0,0,0,.5)` |
| `Shadow/Pop` | `0 12px 40px rgba(0,0,0,.6)` |
| `Shadow/Deck` | `0 18px 50px rgba(0,0,0,.7)` |
| `Shadow/Glow` | `0 0 24px rgba(90,108,236,.4)` — brand-tinted CTA glow |

## 5. Components — v1 scope

Build order is dependency order. Every visual property binds to the variables
above — no hardcoded fills. One page per component.

### 5.1 `Icons` (Tier 0) — from `ui/AppIcon.vue`

24×24, stroke `currentColor` bound to `ink`, round caps/joins. Named
`Icon/<name>`. These are the INSTANCE_SWAP pool for everything below.

| Name | Stroke | Notes |
|---|---|---|
| `close` | 2.4 | ✕ |
| `chevron-down` | 2.6 | rotates 180° when open |
| `check` | 3 | |
| `search` | 2.4 | circle + handle |
| `heart` | filled | the Like verb |
| `edit` | 2.4 | pencil |
| `grid` | 2.2 | 4 rounded rects |
| `list` | 2.2 | 3 lines |
| `card` | 2.2 | deck view |
| `info` | 2.2 | bio link |

### 5.2 `Chip` — from `ui/AppChip.vue`

Pill toggle. Auto-layout, px 16 / py 8, `radius/full`, `Label/Semibold`.

| Axis | Values |
|---|---|
| State | `Default` (card bg, line border, ink-soft text) · `Active` (brand bg, white text, brand border) |

Props: `Label` (TEXT).

### 5.3 `Segment` — from `ui/AppSegmented.vue`

One segment of the single-choice group (the group is composition, not a
variant axis). Auto-layout, py 10, `radius/xl`, `Label/Semibold`, centered.

| Axis | Values |
|---|---|
| State | `Default` · `Active` (same treatment as Chip) |

Props: `Label` (TEXT). Page shows a composed 3-segment example, gap 8.

### 5.4 `CheckRow` — from `ui/CheckRow.vue`

Multi-select menu row: label left, 18px check square right. px 12 / py 10,
`radius/xl`, full-width (fixed 210 in Figma).

| Axis | Values |
|---|---|
| Checked | `Off` (line border square) · `On` (brand square, white check, brand label) |

Props: `Label` (TEXT).

### 5.5 `DecideButton` — from `match/DecideButtons.vue`

Circular verb buttons.

| Axis | Values |
|---|---|
| Verb | `Pass` (✕, navy) · `Like` (♥, pink) · `Bio` (info, brand bg, white icon) |
| Size | `SM` 44px (in-card: paper bg + line border) · `LG` 56px (deck bar: white bg + Shadow/Pop; Bio LG is 48px brand) |

### 5.6 `FacetTrigger` — from `match/FacetPopover.vue`

Filter-bar dropdown trigger. Auto-layout, px 10 / py 8, gap 4, `radius/xl`,
chevron-down instance.

| Axis | Values |
|---|---|
| State | `Default` (line border, ink-soft) · `Open` (ink-faint border, ink) · `Active` (brand/60 border, brand-soft-ish 10% brand bg, brand text) |
| Badge | `On` · `Off` — 18px brand circle, white 10px bold count |

Props: `Label` (TEXT), `Count` (TEXT, badge).

### 5.7 `SelectTrigger` — from `ui/AppSelect.vue`

The input-shaped select trigger. Full-width (fixed 320 in Figma), px 14 /
py 10, `radius/xl`, card bg, line border, chevron-down brand.

| Axis | Values |
|---|---|
| State | `Default` · `Disabled` (55% opacity) |

Props: `Value` (TEXT), `Icon emoji` (TEXT, optional leading emoji).

## 6. Built in v1.1 (was backlog)

- **`RiskBadge`** — Status: `Adopted` / `At risk` / `Safe`. Labels are intrinsic
  per status (no shared TEXT prop — a shared default steamrolls them; instances
  override text directly). At-risk dot pulses in product (`animate-ping`).
- **`MatchRing`** — Tier exemplars `High` 86% (safe) / `Mid` 72% (brand) /
  `Low` 45% (ink-faint) at 52px; arc is a generated SVG path from 12 o'clock.
  Product renders any pct; tier thresholds: ≥80 safe, ≥60 brand.
- **`Cards` page organisms** — `GalleryCard` (240×356, 4:5 photo, gradient
  identity block, badge + 36px ring overlays, SM decide pair) and `ListRow`
  (760w: photo 144, info column with source/transport/tagline, 44px ring +
  decide pair). Photos are placeholder frames — product loads real images.

## 7. Backlog

- Deck card (swipe surface) — the last organism
- `MatchEmptyState`, match toast, bottom nav
- Light-mode shadow variants if Figma adds mode-aware effect styles

## 8. Rebuild procedure (for a fresh file or future sync)

1. Load the Figma MCP skills `figma-use` + `figma-generate-library`.
2. Phase 1: create `Color` (Dark/Light) and `Layout` collections from §1–2 —
   scopes and `WEB` code syntax exactly as tabled; then text styles (§3,
   verify Fredoka styles via `listAvailableFontsAsync` first) and effect
   styles (§4).
3. Phase 2: pages — `Cover`, `Foundations`, `Icons`, then one per component.
4. Phase 3: build §5 in order (icons first — they're swap targets), variants
   via `combineAsVariants`, grid-laid, every fill/stroke/radius/padding bound.
5. Validate each with `get_metadata` + screenshot before the next.
