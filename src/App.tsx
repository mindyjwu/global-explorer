import { MapView } from './components/MapView/MapView';
import { CityPanel } from './components/Panel/CityPanel';
import { FilterBar } from './components/Panel/FilterBar';
import { BackButton } from './components/UI/BackButton';
import { SearchBar } from './components/UI/SearchBar';
import { useAppState } from './store/appState';

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
  return (
    <div
      className="relative overflow-hidden bg-paper"
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <MapView />
      <BackButton />
      <SearchBar />
      <CountryName />
      <GlobeHint />
      <NoCityData />
      <FilterBar />
      <CityPanel />
    </div>
  );
}
