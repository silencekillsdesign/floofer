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
- [x] Marketing foundations + atoms (2026-09-21, CJ approved building it
      for future unification). `Marketing` collection 16 vars
      (VariableCollectionId:2422:2, raw hexes from landing.css), 9
      Marketing/* text styles (Fredoka display + Lexend body — both
      families use no-space style names), BG/Hero|Sun|Tint|Dark paint
      styles (gradient matrices screenshot-validated; Sun's halftone dot
      grid is CSS-only, noted in style description), Marketing/Shadow
      SM|MD|LG. `DS / Marketing` page (2422:1176): Pill 2422:1190 (4
      colors) · Card 2422:1194 · UrgentChip 2422:1197 · NavLink 2422:1205 ·
      SearchPill 2422:1206 · FAQRow 2422:1221 (Closed/Open)
### Organisms + brand + cover (2026-09-21, continued)
- [x] `DS / Brand` FlooferLogo 2423:24 (Color=Brand/Yellow/White, exact
      wordmark SVG incl. tail group; wag animation noted in description)
- [x] `DS / Cards` page: GalleryCard 2424:3 · ListRow 2425:8 ·
      DeckCard 2425:88 (Idle/Like/Pass with ±12° stamps) ·
      MatchEmptyState 2427:12 · MatchToast 2427:21 · BottomNav 2427:26
      (real tab icon paths, pink badge, gradient Plus pill)
- [x] PentagonChart 2428:21 (DS / Components; generated geometry,
      pet+user overlays, legend)
- [x] Marketing organisms: LandingHeader 2428:54 · LandingFooter 2428:79 ·
      Section / Hero 2428:116 (72px 3-line Fredoka H1, yellow NEEDS,
      pills, glow + pup placeholder)
- [x] `DS / Cover` 2428:130 — first page, portfolio face
### Full-page mock + app chrome (2026-09-21, continued)
- [x] `Landing / Full Page` 2429:32 (DS / Marketing) — complete 4,918px
      mock: Header, Hero, Band+Search, Network (4 role cards), Gallery
      (dark, urgent chip), How (3 steps w/ icon instances), Stories,
      FAQ stack (1 open + 3 closed instances), Closing, Footer
- [x] AppHeader 2431:17 (DS / Cards) — paper/85 bar, brand logo instance,
      tab pills + badge, gradient Plus, filter/theme buttons
- [x] FilterBar 2431:48 — breed input + 5 FacetTrigger instances +
      at-risk + view toggle. NOTE: fixed FacetTrigger variants stuck at
      100h (counter FIXED — the hug-sizing bug again) and swapped Active
      fill from paint-opacity to the brand-soft token (paint-level opacity
      on bound variables misrenders inside instances; brand-soft is the
      designed token for that role anyway)
- [x] `Screen / Match` 2431:94 — full desktop assembly from instances
      (AppHeader + title + FilterBar + 4× GalleryCard)
- [ ] FilterPanel sheet, MessageSheet, PlayDateSheet, FastPassCard,
      PhotoUploader, DogPhoto, account organisms
- [ ] Screen assemblies: pet bio, map
- [ ] Screen assemblies (match page, pet bio) — spec §8 backlog

## Conventions

- Validate each build step with get_metadata + screenshot before moving on
- Every fill/stroke/radius/padding binds to the variables above — no raw hex
- Component pages: one page per tier, grid-laid variant sets
- Existing CJ pages are untouched
