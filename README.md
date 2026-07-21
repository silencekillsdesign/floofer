# floofer 🐾

**Swipe. Match. Save a life.**

Tinder-style pet adoption app focused on re-homing dogs at the highest risk of
euthanization — surfacing at-risk animals first from non-kill shelters, fosters,
individual homes, and pet retirement communities.

## Features

- **Swipe deck** — drag/arrow-key swiping; at-risk dogs always surface first,
  sorted by days remaining. Swipe up on the photo to cycle the gallery.
- **Pentagon matching** — 5-axis compatibility (energy, space, social, solo
  time, training) between each dog's needs and your living conditions; live
  match % everywhere.
- **Map** — theme-aware Leaflet map with pulsing red pins for at-risk dogs.
- **Matches** — urgency-sorted list with at-risk / safe / adopted states.
- **Role-based account** — adopter, shelter, foster, rehoming, retirement
  community dashboards; full pet-listing form; file-for-adoption / rehome flow.
- **Live data** — RescueGroups.org (real euthanasia-risk fields) and Petfinder
  (largest inventory) behind a data-source toggle, with demo data fallback.
- Light/dark theme, full-screen pickers with predictive search, localStorage
  persistence throughout.

## Stack

Nuxt 3 · Vue 3 · Tailwind CSS · Leaflet. No backend required for demo mode;
API keys enable live data (see `.env.example`).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (or the port Nuxt picks)
```

### Test on your phone (same Wi-Fi)

```bash
npm run dev -- --host
```

Then open `http://<your-computer's-LAN-IP>:3000` on the phone
(`ipconfig` → IPv4 Address).

### Live adoption data (optional)

Copy `.env.example` → `.env` and add keys:

- `NUXT_RESCUEGROUPS_API_KEY` — free key: <https://rescuegroups.org/services/adoptable-pet-data-api/>
- `NUXT_PETFINDER_API_KEY` + `NUXT_PETFINDER_SECRET` — instant free signup: <https://www.petfinder.com/developers/>

Then switch the data source on the Account screen.

## Deploy

Any Nuxt 3 host works (Netlify/Vercel auto-detect). Set the env vars above in
the host's dashboard to enable live data; the `/api/*` proxy routes deploy as
serverless functions automatically.
