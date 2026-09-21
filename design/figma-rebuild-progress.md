# Figma rebuild progress — file 6GNv0ajh0DLoiRYR7S6oZd ("Floofer" project file)

Working state for the design-system replication into CJ's linked project file
(NOT the separate "Floofer Design System" library file — this is a fresh build
per figma-library.md §9). New pages are prefixed `DS /` to avoid colliding
with CJ's existing marketing pages (design-system, components, Style Guide).

## Done

### Phase 1 — foundations (2026-09-21)
- [x] `Color` collection — 20 vars, Dark/Light modes, scopes + WEB code syntax
      (collection VariableCollectionId:2416:2, dark mode 2416:0, light 2416:1)
- [x] `Layout` collection — 8 spacing + 6 radius (VariableCollectionId:2416:23)
- [x] 9 text styles (Display/Body/Label/Caption per spec §3; Fredoka style
      name is "SemiBold" — no space; Inter is "Semi Bold" — with space)
- [x] 4 effect styles (Shadow/Card, Pop, Deck, Glow)

### Tier 0 + Tier 1 (2026-09-21, same session)
- [x] `DS / Icons` page (2417:2) — all 10 Icon/<name> components from
      AppIcon.vue SVG source, strokes/fills bound to ink (close 2417:5,
      chevron-down 2417:8, check 2417:11, search 2417:15, heart 2417:18,
      edit 2417:1146, grid 2417:1152, list 2417:1155, card 2417:1159,
      info 2417:1164)
- [x] `DS / Components` page (2417:1165):
      Chip 2417:1170 · Segment 2417:1175 · CheckRow 2417:1184 ·
      DecideButton 2419:25 (Verb×Size, 6) · FacetTrigger 2419:56
      (State×Badge, 6; Active uses spread-copy paints for 10%/60% opacity —
      setBoundVariableForPaint returns frozen paints) ·
      SelectTrigger 2419:67 · RiskBadge 2419:75 (remember hug sizing on
      variants: createComponent defaults 100×100 FIXED) · MatchRing 2419:91
      (arcs generated from real geometry, screenshot-validated)

## Next (dependency order per spec §9)

- [ ] Cards: GalleryCard, ListRow (spec §6) — build next, on a `DS / Cards`
      page; needs RiskBadge + MatchRing + DecideButton instances
- [ ] DeckCard, MatchEmptyState, MatchToast, BottomNav (spec §7)
- [ ] NOT in spec yet (code has them, Figma library never did):
      FlooferLogo wordmark, PentagonChart, AppHeader (layouts/default.vue),
      FilterBar organism, FilterPanel sheet, MessageSheet, PlayDateSheet,
      FastPassCard, PhotoUploader, DogPhoto, account organisms
      (AdoptionProfile, ChildrenList, PetsList, AdopterOnboarding steps)
- [ ] Landing/marketing system (landing.css: pills, cards, bg treatments,
      Fredoka/Lexend) — decide with CJ whether it joins this file's existing
      marketing pages or stays code-only
- [ ] Screen assemblies (match page, pet bio) — spec §8 backlog

## Conventions

- Validate each build step with get_metadata + screenshot before moving on
- Every fill/stroke/radius/padding binds to the variables above — no raw hex
- Component pages: one page per tier, grid-laid variant sets
- Existing CJ pages are untouched
