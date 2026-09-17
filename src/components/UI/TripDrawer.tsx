import { useState, useEffect, useRef } from 'react';
import { getTripList, removeFromTrip, googleMapsUrl } from '../../lib/tripList';
import { addToTrip } from '../../lib/tripList';
import type { TripCity } from '../../lib/tripList';
import { loadCities } from '../../lib/cityData';
import { SUPPORTED_COUNTRIES } from '../../lib/constants';

// Map-pin SVG icon (red dot on a pin)
function PinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="6" r="2.5" fill="currentColor" stroke="none" />
      <path d="M8 16C8 16 2.5 10.2 2.5 6a5.5 5.5 0 0111 0C13.5 10.2 8 16 8 16z" strokeLinejoin="round" />
    </svg>
  );
}

interface SearchResult {
  id: string;
  name: string;
  displayName: string | null;
  region: string;
  coordinates: [number, number];
  countryIso2: string;
  countryName: string;
}

export function TripDrawer() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<TripCity[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = () => setList(getTripList());

  useEffect(() => {
    refresh();
    window.addEventListener('tripListUpdated', refresh);
    return () => window.removeEventListener('tripListUpdated', refresh);
  }, []);

  // Search cities across all supported countries when query changes
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const q = query.toLowerCase();

    const run = async () => {
      const found: SearchResult[] = [];
      const countryCodes = Object.keys(SUPPORTED_COUNTRIES);
      // Search a subset of prominent countries for quick results
      const priority = ['US','GB','FR','IT','ES','DE','JP','AU','BR','MX','PT','GR','TH','IN','ZA','PE','AR','NL','TR','CA'];
      const ordered = [...priority, ...countryCodes.filter(c => !priority.includes(c))];

      for (const iso2 of ordered) {
        if (found.length >= 20) break;
        const cfg = SUPPORTED_COUNTRIES[iso2];
        try {
          const cities = await loadCities(cfg.citiesFile);
          if (!cities) continue;
          for (const city of cities) {
            const displayName = city.content?.displayName ?? city.name;
            if (displayName.toLowerCase().includes(q) || city.name.toLowerCase().includes(q)) {
              found.push({
                id: city.id,
                name: city.name,
                displayName: city.content?.displayName ?? null,
                region: city.region,
                coordinates: city.coordinates,
                countryIso2: iso2,
                countryName: cfg.name,
              });
            }
            if (found.length >= 20) break;
          }
        } catch { /* skip country */ }
      }
      setResults(found);
      setSearching(false);
    };

    const timer = setTimeout(run, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = (r: SearchResult) => {
    const cfg = SUPPORTED_COUNTRIES[r.countryIso2];
    if (!cfg) return;
    addToTrip(
      {
        id: r.id,
        name: r.name,
        region: r.region,
        coordinates: r.coordinates,
        population: 0,
        content: {
          displayName: r.displayName ?? r.name,
          knownFor: '',
          tags: [],
          source: 'curated' as const,
        },
      },
      cfg,
    );
    window.dispatchEvent(new Event('tripListUpdated'));
    setQuery('');
    setResults([]);
  };

  const remove = (cityId: string) => {
    setList(removeFromTrip(cityId));
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => searchRef.current?.focus(), 150); }}
        className="absolute bottom-20 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-xl
                   bg-paper border border-line text-cobalt text-sm font-medium
                   shadow-sm hover:bg-paper-2 transition-colors duration-150"
        aria-label="Open trip list"
      >
        <PinIcon className="w-4 h-4" />
        <span className="font-mono text-xs tracking-widest uppercase">My Trip</span>
        {list.length > 0 && (
          <span className="bg-cobalt text-paper text-[10px] font-mono rounded-full w-4 h-4
                           flex items-center justify-center leading-none">
            {list.length}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="absolute inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={[
          'absolute bottom-0 left-0 right-0 z-50 bg-paper border-t border-line rounded-t-2xl shadow-2xl',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ maxHeight: '75vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <PinIcon className="w-4 h-4 text-cobalt" />
            <div>
              <h2 className="font-display text-xl font-semibold text-ink leading-none">My Trip</h2>
              <p className="font-mono text-[10px] tracking-widest uppercase text-ink-soft mt-0.5">
                {list.length === 0 ? 'No cities saved' : `${list.length} destination${list.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 text-ink-soft hover:text-ink transition-colors" aria-label="Close">
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search to add */}
        <div className="px-6 pt-3 pb-2">
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search a city to add…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-line bg-paper-2
                         font-body text-sm text-ink placeholder:text-ink-soft/60
                         focus:outline-none focus:border-cobalt-soft transition-colors"
            />
            <svg viewBox="0 0 16 16" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-soft"
                 fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {(results.length > 0 || searching) && (
            <div className="mt-1 border border-line rounded-lg bg-paper shadow-lg max-h-48 overflow-y-auto">
              {searching && results.length === 0 && (
                <p className="px-3 py-2 text-xs text-ink-soft font-mono">Searching…</p>
              )}
              {results.map(r => {
                const alreadySaved = list.some(c => c.cityId === r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => !alreadySaved && handleAdd(r)}
                    disabled={alreadySaved}
                    className="w-full flex items-center justify-between px-3 py-2 text-left
                               hover:bg-paper-2 transition-colors disabled:opacity-50"
                  >
                    <div>
                      <div className="font-body text-sm text-ink">{r.displayName ?? r.name}</div>
                      <div className="font-mono text-[11px] text-ink-soft">{r.countryName} · {r.region}</div>
                    </div>
                    {alreadySaved ? (
                      <span className="text-[10px] font-mono text-cobalt uppercase tracking-wide">Saved</span>
                    ) : (
                      <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 text-cobalt flex-none" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 2v10M2 7h10" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* City list */}
        <div className="overflow-y-auto px-2" style={{ maxHeight: 'calc(75vh - 200px)' }}>
          {list.length === 0 && !query ? (
            <div className="px-6 py-8 text-center">
              <PinIcon className="w-7 h-7 text-cobalt/40 mx-auto mb-3" />
              <p className="font-body text-sm text-ink-soft">
                Search above or tap the bookmark on any city to start planning.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((city) => (
                <li key={city.cityId} className="flex items-center gap-3 px-4 py-3">
                  <PinIcon className="w-3.5 h-3.5 text-cobalt flex-none" />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm font-medium text-ink truncate">
                      {city.displayName ?? city.cityName}
                    </div>
                    <div className="font-mono text-[11px] text-ink-soft tracking-wide">
                      {city.country.name} · {city.region}
                    </div>
                  </div>
                  <a
                    href={googleMapsUrl(city.coordinates, city.displayName ?? city.cityName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono
                               text-cobalt border border-cobalt/30 hover:bg-cobalt/5 transition-colors"
                  >
                    <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="7" cy="5.5" r="2"/>
                      <path d="M7 14C7 14 2 9 2 5.5a5 5 0 0110 0C12 9 7 14 7 14z" strokeLinejoin="round"/>
                    </svg>
                    Maps
                  </a>
                  <button
                    onClick={() => remove(city.cityId)}
                    className="p-1 text-ink-soft hover:text-red-400 transition-colors"
                    aria-label="Remove"
                  >
                    <svg viewBox="0 0 14 14" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
