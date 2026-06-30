import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppState } from '../../store/appState';
import { loadCities } from '../../lib/cityData';
import { getSearchIndex, searchCities } from '../../lib/searchIndex';
import type { SearchEntry } from '../../lib/searchIndex';
import { getRecentCities, addRecentCity } from '../../lib/recentCities';
import type { RecentCity } from '../../lib/recentCities';

export function SearchBar() {
  const { view, beginFly, setCities, selectCity } = useAppState();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [indexLoading, setIndexLoading] = useState(false);
  const [recents, setRecents] = useState<RecentCity[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load search index on first open
  const ensureIndex = useCallback(async () => {
    if (index) return index;
    setIndexLoading(true);
    const loaded = await getSearchIndex();
    setIndex(loaded);
    setIndexLoading(false);
    return loaded;
  }, [index]);

  // Keyboard shortcut: / or Cmd+K
  useEffect(() => {
    if (view !== 'globe') return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        setOpen(true);
        setRecents(getRecentCities());
        setTimeout(() => inputRef.current?.focus(), 0);
        ensureIndex();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setRecents(getRecentCities());
        setTimeout(() => inputRef.current?.focus(), 0);
        ensureIndex();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view, ensureIndex]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setResults([]);
        setActiveIdx(-1);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Update results on query change
  useEffect(() => {
    if (!index || !query) {
      setResults([]);
      setActiveIdx(-1);
      return;
    }
    setResults(searchCities(index, query));
    setActiveIdx(-1);
  }, [query, index]);

  // Reset search state when leaving globe view
  useEffect(() => {
    if (view !== 'globe') {
      setOpen(false);
      setQuery('');
      setResults([]);
      setActiveIdx(-1);
    }
  }, [view]);

  const handleSelect = useCallback(async (entry: SearchEntry) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIdx(-1);

    // Fly to the country
    beginFly(entry.country);

    // Load that country's cities
    const cities = await loadCities(entry.country.citiesFile);
    setCities(cities);

    // For a city match, also select it to open the CityPanel
    if (entry.type === 'city') {
      const match = cities?.find((c) => c.id === entry.city.id) ?? null;
      if (match) {
        selectCity(match);
      }
      setRecents(addRecentCity({
        cityId: entry.city.id,
        cityName: entry.city.name,
        displayName: entry.city.content?.displayName ?? null,
        region: entry.city.region,
        country: entry.country,
      }));
    }
  }, [beginFly, setCities, selectCity]);

  const handleSelectRecent = useCallback((recent: RecentCity) => {
    handleSelect({
      type: 'city',
      city: { id: recent.cityId, name: recent.cityName, region: recent.region, coordinates: [0, 0], population: 0, content: recent.displayName ? { displayName: recent.displayName, knownFor: '', tags: [], source: 'llm' } : null },
      country: recent.country,
      searchName: recent.cityName.toLowerCase(),
      searchDisplay: recent.displayName?.toLowerCase() ?? null,
    });
  }, [handleSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setResults([]);
      setActiveIdx(-1);
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setRecents(getRecentCities());
    ensureIndex();
  };

  // Only render on globe view
  if (view !== 'globe') return null;

  return (
    <div ref={containerRef} className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-[320px]">
      {/* Search input */}
      <div
        className={[
          'flex items-center gap-2 px-3 py-2 rounded-xl bg-paper border border-line',
          'shadow-sm transition-all duration-150',
          open ? 'ring-1 ring-cobalt/30 border-cobalt-soft' : 'hover:border-ink-soft',
        ].join(' ')}
      >
        <svg
          className="w-4 h-4 text-ink-soft flex-none"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10l4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search cities…"
          className="flex-1 bg-transparent outline-none text-sm font-body text-ink placeholder:text-ink-soft/50"
        />
        {!open && (
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-ink-soft/60 bg-paper-2
                          border border-line rounded px-1.5 py-0.5 leading-none">/</kbd>
        )}
        {open && query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="text-ink-soft hover:text-ink transition-colors"
            aria-label="Clear search"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Recently viewed (shown when focused with no query yet) */}
      {open && !query && !indexLoading && recents.length > 0 && (
        <div className="mt-1.5 rounded-xl bg-paper border border-line shadow-lg overflow-hidden max-h-[320px] overflow-y-auto">
          <div className="px-4 pt-2.5 pb-1 text-[10px] font-mono text-ink-soft/70 tracking-wide uppercase">
            Recently viewed
          </div>
          {recents.map((recent) => (
            <button
              key={recent.cityId}
              onClick={() => handleSelectRecent(recent)}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors duration-100 hover:bg-paper-2"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-body text-ink truncate">
                  {recent.displayName ?? recent.cityName}
                </div>
                <div className="text-[11px] font-mono text-ink-soft tracking-wide truncate">
                  {recent.country.name} · {recent.region}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (query || indexLoading) && (
        <div className="mt-1.5 rounded-xl bg-paper border border-line shadow-lg overflow-hidden max-h-[320px] overflow-y-auto">
          {indexLoading && (
            <div className="px-4 py-3 text-xs font-mono text-ink-soft tracking-wide animate-pulse">
              Loading cities…
            </div>
          )}
          {!indexLoading && query && results.length === 0 && (
            <div className="px-4 py-3 text-xs font-mono text-ink-soft tracking-wide">
              No cities found
            </div>
          )}
          {results.map((entry, i) => (
            <button
              key={entry.type === 'city' ? `${entry.country.iso2}-${entry.city.id}` : entry.country.iso2}
              onClick={() => handleSelect(entry)}
              onMouseEnter={() => setActiveIdx(i)}
              className={[
                'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors duration-100',
                i === activeIdx ? 'bg-paper-2' : 'hover:bg-paper-2',
              ].join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-body text-ink truncate">
                  {entry.type === 'city' ? (entry.city.content?.displayName ?? entry.city.name) : entry.country.name}
                </div>
                <div className="text-[11px] font-mono text-ink-soft tracking-wide truncate">
                  {entry.type === 'city' ? `${entry.country.name} · ${entry.city.region}` : 'Country'}
                </div>
              </div>
              <svg
                className="w-3.5 h-3.5 text-cobalt-soft flex-none"
                style={{ opacity: i === activeIdx ? 0.7 : 0, transition: 'opacity 0.15s' }}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
