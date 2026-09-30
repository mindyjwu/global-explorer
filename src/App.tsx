import { useEffect } from 'react';
import { MapView } from './components/MapView/MapView';
import { CityPanel } from './components/Panel/CityPanel';
import { FilterBar } from './components/Panel/FilterBar';
import { MetStrip } from './components/Panel/MetStrip';
import { BackButton } from './components/UI/BackButton';
import { SearchBar } from './components/UI/SearchBar';
import { SurpriseMeButton } from './components/UI/SurpriseMeButton';
import { ContinentNav } from './components/UI/ContinentNav';
import { TripDrawer } from './components/UI/TripDrawer';
import { useAppState } from './store/appState';
import { useUrlSync } from './lib/urlSync';

// Covers the blank few seconds while the 3D globe and its tiles load.
function GlobeLoader() {
  const { mapReady, setMapReady } = useAppState();
  // Never trap anyone behind the loader if the map is slow to report in.
  useEffect(() => {
    if (mapReady) return;
    const t = setTimeout(setMapReady, 15000);
    return () => clearTimeout(t);
  }, [mapReady, setMapReady]);
  return (
    <div
      role="status"
      aria-hidden={mapReady}
      className={`absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-paper
                  transition-opacity duration-700 ${mapReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="h-12 w-12 rounded-full border-2 border-line border-t-ink/60 motion-safe:animate-spin" />
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50">Loading the globe…</p>
    </div>
  );
}

function PortfolioLink() {
  return (
    <a
      href="https://mindy-portfolio.vercel.app"
      className="absolute bottom-5 left-5 z-20 hidden sm:flex items-center gap-1.5 font-mono text-[10px]
                 tracking-[0.18em] uppercase text-ink/55 hover:text-ink bg-paper/70 backdrop-blur-sm
                 px-3 py-1.5 rounded-full border border-line transition-colors"
    >
      By Mindy Wu ↗
    </a>
  );
}

function GlobeHint() {
  const { view } = useAppState();
  if (view !== 'globe') return null;
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50 bg-paper/70
                    backdrop-blur-sm px-4 py-2 rounded-full border border-line">
        Click a country to explore
      </p>
    </div>
  );
}

function CountryName() {
  const { view, activeCountry, isLoading } = useAppState();
  if (view !== 'country' || !activeCountry) return null;
  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-2">
      <h1 className="font-display text-4xl font-semibold text-ink drop-shadow-sm">
        {activeCountry.name}
      </h1>
      {isLoading && (
        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink/40
                         bg-paper/60 backdrop-blur-sm px-3 py-1 rounded-full animate-pulse">
          Loading destinations…
        </span>
      )}
    </div>
  );
}

function NoCityData() {
  const { view, isLoading, cities } = useAppState();
  if (view !== 'country' || isLoading || cities.length > 0) return null;
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50 bg-paper/70
                    backdrop-blur-sm px-4 py-2 rounded-full border border-line">
        No destination data for this country yet
      </p>
    </div>
  );
}

export default function App() {
  useUrlSync();
  return (
    <div
      className="relative overflow-hidden bg-paper"
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <MapView />
      <BackButton />
      <SearchBar />
      <SurpriseMeButton />
      <ContinentNav />
      <CountryName />
      <GlobeHint />
      <NoCityData />
      <MetStrip />
      <FilterBar />
      <CityPanel />
      <TripDrawer />
      <PortfolioLink />
      <GlobeLoader />
    </div>
  );
}
