# Global Explorer

An interactive 3D globe for discovering cities around the world. Spin the globe, click a country, and browse curated city destinations — 1,100+ cities across 111 countries, searchable and filterable, with shareable URLs for any view.

**Live site:** [global-explorer-ivory.vercel.app](https://global-explorer-ivory.vercel.app)

## Features

- **3D globe navigation** — click any country to zoom into its cities
- **1,135 cities in 111 countries**, served as static per-country JSON for fast loads
- **Search** with a client-side index, plus filters and a "Surprise me" button
- **Shareable URLs** — the view state syncs to the URL, so any city or country view can be linked directly
- **Recent cities** — picks up where you left off

## Tech stack

- React 19 + TypeScript, built with Vite
- [MapLibre GL](https://maplibre.org) for globe and map rendering, with [OpenFreeMap](https://openfreemap.org) tiles (no API key needed)
- Zustand for state management
- Tailwind CSS 4
- City data sourced from [GeoNames](https://www.geonames.org)
- Deployed on Vercel

## Why I built it

I wanted to see how far a map-first UI could go for travel discovery — no lists, no forms, just a globe you can poke at. It was also an exercise in handling a real dataset: fetching and filtering GeoNames data into static JSON that a client-only app can serve without a backend.

Built with [Claude Code](https://claude.com/claude-code).

## Running locally

```bash
npm install
npm run dev
```

No API keys required — map tiles come from OpenFreeMap. See `.env.example` if you want to swap tile providers or refresh the city data.
