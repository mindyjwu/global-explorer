import { useState, useEffect } from 'react';
import { getTripList, removeFromTrip, googleMapsUrl } from '../../lib/tripList';
import type { TripCity } from '../../lib/tripList';

interface Props {
  onCountChange?: (n: number) => void;
}

export function TripDrawer({ onCountChange }: Props) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<TripCity[]>([]);

  const refresh = () => {
    const l = getTripList();
    setList(l);
    onCountChange?.(l.length);
  };

  useEffect(() => {
    refresh();
    window.addEventListener('tripListUpdated', refresh);
    return () => window.removeEventListener('tripListUpdated', refresh);
  }, []);

  const remove = (cityId: string) => {
    const next = removeFromTrip(cityId);
    setList(next);
    onCountChange?.(next.length);
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-20 right-5 z-30 flex items-center gap-2 px-3 py-2 rounded-xl
                   bg-paper border border-line text-ink text-sm font-medium
                   shadow-sm hover:bg-paper-2 transition-colors duration-150"
        aria-label="Open trip list"
      >
        <svg viewBox="0 0 16 16" className="w-4 h-4 text-cobalt flex-none" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" strokeLinecap="round"/>
          <path d="M5 6h6M5 9h4" strokeLinecap="round"/>
        </svg>
        <span className="font-mono text-xs tracking-widest uppercase text-cobalt">
          My Trip
        </span>
        {list.length > 0 && (
          <span className="bg-cobalt text-paper text-[10px] font-mono rounded-full w-4 h-4 flex items-center justify-center leading-none">
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
        style={{ maxHeight: '70vh' }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-line">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">My Trip</h2>
            <p className="font-mono text-[10px] tracking-widest uppercase text-ink-soft mt-0.5">
              {list.length === 0 ? 'No cities saved yet' : `${list.length} destination${list.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 text-ink-soft hover:text-ink transition-colors" aria-label="Close">
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
          {list.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-3xl mb-3">✈️</div>
              <p className="font-body text-sm text-ink-soft">
                Tap the bookmark on any city to start planning your trip.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {list.map((city) => (
                <li key={city.cityId} className="flex items-center gap-3 px-6 py-3.5">
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
                      <circle cx="7" cy="5.5" r="2.5"/>
                      <path d="M7 14C7 14 2 9.5 2 5.5a5 5 0 0110 0C12 9.5 7 14 7 14z" strokeLinejoin="round"/>
                    </svg>
                    Maps
                  </a>
                  <button
                    onClick={() => remove(city.cityId)}
                    className="p-1 text-ink-soft hover:text-red-500 transition-colors"
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
