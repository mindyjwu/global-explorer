import { useCallback, useState } from 'react';
import { useAppState } from '../../store/appState';
import { loadCities } from '../../lib/cityData';
import { getSearchIndex } from '../../lib/searchIndex';
import { addRecentCity } from '../../lib/recentCities';

export function SurpriseMeButton() {
  const { view, beginFly, setCities, selectCity } = useAppState();
  const [isPicking, setIsPicking] = useState(false);

  const handleClick = useCallback(async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const index = await getSearchIndex();
      const cityEntries = index.filter((e) => e.type === 'city');
      if (cityEntries.length === 0) return;
      const pick = cityEntries[Math.floor(Math.random() * cityEntries.length)];

      beginFly(pick.country);
      const cities = await loadCities(pick.country.citiesFile);
      setCities(cities);

      const match = cities?.find((c) => c.id === pick.city.id) ?? null;
      if (match) {
        selectCity(match);
        addRecentCity({
          cityId: pick.city.id,
          cityName: pick.city.name,
          displayName: pick.city.content?.displayName ?? null,
          region: pick.city.region,
          country: pick.country,
        });
      }
    } finally {
      setIsPicking(false);
    }
  }, [isPicking, beginFly, setCities, selectCity]);

  if (view !== 'globe') return null;

  return (
    <button
      onClick={handleClick}
      disabled={isPicking}
      className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 rounded-xl
                 bg-paper border border-line text-ink text-sm font-medium
                 shadow-sm hover:bg-paper-2 transition-colors duration-150 group
                 disabled:opacity-60 disabled:cursor-wait"
      aria-label="Jump to a random city"
    >
      <svg
        className={[
          'w-4 h-4 text-cobalt transition-transform duration-300',
          isPicking ? 'animate-spin' : 'group-hover:rotate-12',
        ].join(' ')}
        viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M3 5h2.5L8 9l1-1.5L10.5 9H13" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 5H13v2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11h2.5L7 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-cobalt font-mono text-xs tracking-widest uppercase">
        Surprise me
      </span>
    </button>
  );
}
