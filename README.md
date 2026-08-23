# Global Explorer

**[global-explorer-ivory.vercel.app](https://global-explorer-ivory.vercel.app)**

A globe you can actually spin. Click a country, browse its cities, get lost for a while — 1,135 cities across 111 countries, searchable, filterable, and shareable by URL so a specific city view is a link you can send someone, not a screenshot.

I did a semester at NYU Paris and have been trying to recreate that "where should I go next" feeling in an app ever since — most travel sites bury it under login walls and listicles before you get to look at an actual map. This is the version with no forms in the way: you land on a globe, not a homepage.

## What's in it

- Click any country on the 3D globe to zoom into its cities
- 1,135 cities served as static per-country JSON, so it stays fast without a backend
- Client-side search plus filters, and a "Surprise me" button for when you don't know where you want to go
- Shareable URLs — whatever you're looking at is encoded in the link
- Picks up your recent cities so you don't lose your place

## Stack

React 19 + TypeScript on Vite, MapLibre GL for the globe and map rendering (OpenFreeMap tiles, no API key required), Zustand for state, Tailwind 4. City data sourced from GeoNames and pre-filtered into static JSON. Deployed on Vercel.

## Why it's built this way

The interesting part wasn't the globe rendering — MapLibre does most of that for you — it was making a real geographic dataset (GeoNames, which is enormous and messy) fast enough to feel instant in a client-only app with no server to lean on. Everything gets pre-processed into small per-country files at build time instead of queried live.

## Running it locally

```bash
npm install
npm run dev
```

No API keys needed — tiles come from OpenFreeMap. See `.env.example` if you want to swap tile providers or regenerate the city data.
