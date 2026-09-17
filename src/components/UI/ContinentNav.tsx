import { CONTINENTS } from '../../lib/constants';
import { useAppState } from '../../store/appState';

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
          className="group flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full
                     bg-paper/85 border border-line backdrop-blur-sm
                     hover:bg-paper hover:shadow-md
                     transition-all duration-150 text-left"
          style={{ '--c-accent': c.color } as React.CSSProperties}
        >
          <span
            className="w-2 h-2 rounded-full flex-none"
            style={{ background: c.color }}
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-ink-soft
                           group-hover:text-ink transition-colors duration-150 whitespace-nowrap">
            {c.name}
          </span>
        </button>
      ))}
    </div>
  );
}
