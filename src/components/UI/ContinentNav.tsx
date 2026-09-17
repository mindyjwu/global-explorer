import { CONTINENTS } from '../../lib/constants';
import { useAppState } from '../../store/appState';

// Fires map.flyTo without loading cities (continent overview, not a country).
// We inject a one-off callback through a module-level ref set by MapView.
let flyToContinent: ((center: [number, number], zoom: number) => void) | null = null;
export function registerContinentFly(fn: typeof flyToContinent) {
  flyToContinent = fn;
}

export function ContinentNav() {
  const { view } = useAppState();
  if (view !== 'globe') return null;

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
      {CONTINENTS.map((c) => (
        <button
          key={c.name}
          onClick={() => flyToContinent?.(c.center, c.zoom)}
          title={c.name}
          className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full
                     bg-paper/80 border border-line backdrop-blur-sm
                     hover:bg-paper hover:border-cobalt-soft hover:shadow-md
                     transition-all duration-150 text-left"
        >
          <span className="text-base leading-none">{c.emoji}</span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-soft
                           group-hover:text-ink transition-colors duration-150 whitespace-nowrap">
            {c.name}
          </span>
        </button>
      ))}
    </div>
  );
}
