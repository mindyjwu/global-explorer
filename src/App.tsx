import { MapView } from './components/MapView/MapView';
import { CityPanel } from './components/Panel/CityPanel';
import { FilterBar } from './components/Panel/FilterBar';
import { BackButton } from './components/UI/BackButton';
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
  const { view, activeCountry } = useAppState();
  if (view !== 'country' || !activeCountry) return null;
  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <h1 className="font-display text-4xl font-semibold text-ink drop-shadow-sm">
        {activeCountry.name}
      </h1>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-paper">
      <MapView />
      <BackButton />
      <CountryName />
      <GlobeHint />
      <FilterBar />
      <CityPanel />
    </div>
  );
}
