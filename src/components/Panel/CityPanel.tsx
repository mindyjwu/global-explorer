import { useEffect } from 'react';
import { useAppState } from '../../store/appState';
import { TAG_LABELS } from '../../lib/constants';
import type { InterestTag, CityContent } from '../../types';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function SafetyDots({ rating }: { rating: number }) {
  const full = Math.round(rating);
  const color = rating >= 4 ? 'bg-emerald-500' : rating >= 3 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`inline-block w-2 h-2 rounded-full ${i < full ? color : 'bg-line'}`} />
      ))}
    </div>
  );
}

function TripInfo({ content }: { content: CityContent }) {
  const { stayDays, bestMonths, avgCostUSD, avgTempC, safetyRating } = content;
  if (!stayDays && !bestMonths && !avgCostUSD && !avgTempC && !safetyRating) return null;

  return (
    <div className="mt-5 pt-4 border-t border-line grid grid-cols-2 gap-x-4 gap-y-4">
      {stayDays && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-0.5">Stay</div>
          <div className="text-sm font-body text-ink">
            {stayDays.min === stayDays.max ? `${stayDays.min} days` : `${stayDays.min}–${stayDays.max} days`}
          </div>
        </div>
      )}
      {avgCostUSD && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-0.5">Daily budget</div>
          <div className="text-sm font-body text-ink">${avgCostUSD} <span className="text-[11px] text-ink-soft">/ person</span></div>
        </div>
      )}
      {avgTempC && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-0.5">Temperature</div>
          <div className="text-sm font-body text-ink">{avgTempC.low}–{avgTempC.high}°C</div>
        </div>
      )}
      {safetyRating && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-1">Safety</div>
          <SafetyDots rating={safetyRating} />
        </div>
      )}
      {bestMonths && bestMonths.length > 0 && (
        <div className="col-span-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-1.5">Best time to visit</div>
          <div className="flex flex-wrap gap-1">
            {MONTH_SHORT.map((m, i) => {
              const active = bestMonths.includes(i + 1);
              return (
                <span
                  key={m}
                  className={[
                    'px-1.5 py-0.5 rounded text-[10px] font-mono',
                    active
                      ? 'bg-cobalt text-paper'
                      : 'bg-line/40 text-ink-soft',
                  ].join(' ')}
                >
                  {m}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const TAG_COLORS: Record<InterestTag, { bg: string; text: string }> = {
  nature:        { bg: 'bg-emerald-50',  text: 'text-emerald-800' },
  beaches:       { bg: 'bg-teal-50',     text: 'text-teal-800' },
  adventure:     { bg: 'bg-green-50',    text: 'text-green-800' },
  'food-wine':   { bg: 'bg-amber-50',    text: 'text-amber-800' },
  'street-food': { bg: 'bg-orange-50',   text: 'text-orange-800' },
  history:       { bg: 'bg-blue-50',     text: 'text-blue-800' },
  shopping:      { bg: 'bg-purple-50',   text: 'text-purple-800' },
  nightlife:     { bg: 'bg-rose-50',     text: 'text-rose-800' },
};

export function CityPanel() {
  const { selectedCity, activeCountry, selectCity } = useAppState();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectCity(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectCity]);

  const isOpen = !!selectedCity;

  return (
    <div
      className={[
        'absolute top-0 right-0 h-full w-[340px] z-20 flex flex-col',
        'bg-paper border-l border-line shadow-xl',
        'transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 border-b border-line">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-cobalt mb-1">
            {activeCountry?.name} · {selectedCity?.region}
          </div>
          <h2 className="font-display text-3xl font-semibold text-ink leading-none">
            {selectedCity?.content?.displayName ?? selectedCity?.name}
          </h2>
        </div>
        <button
          onClick={() => selectCity(null)}
          className="p-1.5 -mt-0.5 text-ink-soft hover:text-ink transition-colors"
          aria-label="Close panel"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {selectedCity && (
        <div className="flex-1 overflow-y-auto p-6 pt-5">
          {selectedCity.content ? (
            <>
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {selectedCity.content.tags.map((tag) => {
                  const c = TAG_COLORS[tag];
                  return (
                    <span
                      key={tag}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide uppercase ${c.bg} ${c.text}`}
                    >
                      {TAG_LABELS[tag]}
                    </span>
                  );
                })}
              </div>

              {/* Known-for blurb */}
              <p className="font-body text-[15px] leading-relaxed text-ink-soft">
                {selectedCity.content.knownFor}
              </p>

              {/* Trip info */}
              <TripInfo content={selectedCity.content} />

              {/* Divider + meta */}
              <div className="mt-5 pt-4 border-t border-line">
                <div className="flex items-center gap-4 text-xs font-mono text-ink-soft">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest mb-0.5">Region</div>
                    <div className="text-ink">{selectedCity.region}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest mb-0.5">Population</div>
                    <div className="text-ink">
                      {selectedCity.population > 1_000_000
                        ? `${(selectedCity.population / 1_000_000).toFixed(1)}M`
                        : `${Math.round(selectedCity.population / 1000)}K`}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-ink-soft italic mt-2">
              Editorial content coming soon for {selectedCity.name}.
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      {isOpen && (
        <div className="px-6 py-3 border-t border-line">
          <p className="text-[11px] font-mono text-ink-soft tracking-wide">Press Esc to close</p>
        </div>
      )}
    </div>
  );
}
