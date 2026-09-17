import { useEffect, useState } from 'react';
import { useAppState } from '../../store/appState';
import { TAG_LABELS, COUNTRY_CONTINENT } from '../../lib/constants';
import { addToTrip, removeFromTrip, isSaved, googleMapsUrl } from '../../lib/tripList';
import type { InterestTag, CityContent } from '../../types';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function SafetyDots({ rating }: { rating: number }) {
  const full = Math.round(rating);
  const color = rating >= 4 ? 'bg-emerald-500' : rating >= 3 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1">
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
    <div className="mt-5 pt-4 border-t border-line grid grid-cols-2 gap-x-6 gap-y-4">
      {stayDays && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-1">Stay</div>
          <div className="text-sm font-body text-ink font-medium">
            {stayDays.min === stayDays.max ? `${stayDays.min} days` : `${stayDays.min}–${stayDays.max} days`}
          </div>
        </div>
      )}
      {avgCostUSD && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-1">Budget</div>
          <div className="text-sm font-body text-ink font-medium">${avgCostUSD}<span className="text-[11px] text-ink-soft font-normal"> / day</span></div>
        </div>
      )}
      {avgTempC && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-1">Temp</div>
          <div className="text-sm font-body text-ink font-medium">{avgTempC.low}–{avgTempC.high}°C</div>
        </div>
      )}
      {safetyRating && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-1.5">Safety</div>
          <SafetyDots rating={safetyRating} />
        </div>
      )}
      {bestMonths && bestMonths.length > 0 && (
        <div className="col-span-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft mb-2">Best time to visit</div>
          <div className="flex flex-wrap gap-1">
            {MONTH_SHORT.map((m, i) => {
              const active = bestMonths.includes(i + 1);
              return (
                <span
                  key={m}
                  className={[
                    'px-1.5 py-0.5 rounded text-[10px] font-mono',
                    active ? 'bg-cobalt text-paper' : 'bg-line/40 text-ink-soft',
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
  nature:        { bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  beaches:       { bg: 'bg-teal-50',     text: 'text-teal-700' },
  adventure:     { bg: 'bg-green-50',    text: 'text-green-700' },
  'food-wine':   { bg: 'bg-amber-50',    text: 'text-amber-700' },
  'street-food': { bg: 'bg-orange-50',   text: 'text-orange-700' },
  history:       { bg: 'bg-blue-50',     text: 'text-blue-700' },
  shopping:      { bg: 'bg-purple-50',   text: 'text-purple-700' },
  nightlife:     { bg: 'bg-rose-50',     text: 'text-rose-700' },
};

const TAG_ICONS: Record<InterestTag, string> = {
  nature: '🌿', beaches: '🏖', adventure: '🧗', 'food-wine': '🍷',
  'street-food': '🍜', history: '🏛', shopping: '🛍', nightlife: '✦',
};

export function CityPanel() {
  const { selectedCity, activeCountry, selectCity } = useAppState();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (selectedCity) setSaved(isSaved(selectedCity.id));
  }, [selectedCity]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectCity(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectCity]);

  const handleSave = () => {
    if (!selectedCity || !activeCountry) return;
    if (saved) {
      removeFromTrip(selectedCity.id);
      setSaved(false);
    } else {
      addToTrip(selectedCity, activeCountry);
      setSaved(true);
    }
    window.dispatchEvent(new Event('tripListUpdated'));
  };

  const isOpen = !!selectedCity;
  const continent = activeCountry ? (COUNTRY_CONTINENT[activeCountry.iso2] ?? '') : '';
  const mapsUrl = selectedCity
    ? googleMapsUrl(selectedCity.coordinates, selectedCity.content?.displayName ?? selectedCity.name)
    : '#';

  return (
    <div
      className={[
        'absolute top-0 right-0 h-full w-[360px] z-20 flex flex-col',
        'bg-paper/95 backdrop-blur-md border-l border-line shadow-2xl',
        'transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-line">
        {/* Breadcrumb */}
        {continent && (
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-soft/60 mb-1">
            {continent} · {activeCountry?.name}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-cobalt mb-1.5">
              {selectedCity?.region}
            </div>
            <h2 className="font-display text-[28px] font-semibold text-ink leading-tight">
              {selectedCity?.content?.displayName ?? selectedCity?.name}
            </h2>
          </div>

          {/* Save + Close */}
          <div className="flex items-center gap-1 flex-none mt-0.5">
            <button
              onClick={handleSave}
              title={saved ? 'Remove from trip' : 'Save to trip'}
              className={[
                'p-2 rounded-lg transition-all duration-150',
                saved
                  ? 'text-cobalt bg-cobalt/10 hover:bg-cobalt/15'
                  : 'text-ink-soft hover:text-cobalt hover:bg-cobalt/8',
              ].join(' ')}
              aria-label={saved ? 'Remove from trip' : 'Save to trip'}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                <path d="M3 2h10a1 1 0 011 1v10l-6-3-6 3V3a1 1 0 011-1z" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => selectCity(null)}
              className="p-2 rounded-lg text-ink-soft hover:text-ink hover:bg-paper-2 transition-colors"
              aria-label="Close"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tags row */}
        {selectedCity?.content?.tags && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {selectedCity.content.tags.map((tag) => {
              const c = TAG_COLORS[tag];
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide uppercase ${c.bg} ${c.text}`}
                >
                  <span className="text-[11px] leading-none">{TAG_ICONS[tag]}</span>
                  {TAG_LABELS[tag]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      {selectedCity && (
        <div className="flex-1 overflow-y-auto p-6 pt-5 pb-4">
          {selectedCity.content ? (
            <>
              {/* Known-for blurb */}
              <p className="font-body text-[14.5px] leading-relaxed text-ink/80">
                {selectedCity.content.knownFor}
              </p>

              {/* Trip info */}
              <TripInfo content={selectedCity.content} />

              {/* Meta row */}
              <div className="mt-5 pt-4 border-t border-line flex items-center gap-5 text-xs font-mono text-ink-soft">
                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-0.5">Region</div>
                  <div className="text-ink text-[12px]">{selectedCity.region}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest mb-0.5">Population</div>
                  <div className="text-ink text-[12px]">
                    {selectedCity.population > 1_000_000
                      ? `${(selectedCity.population / 1_000_000).toFixed(1)}M`
                      : `${Math.round(selectedCity.population / 1000)}K`}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft italic mt-2">
              No editorial content for {selectedCity.name} yet.
            </p>
          )}
        </div>
      )}

      {/* Footer — Google Maps CTA */}
      {isOpen && (
        <div className="px-6 py-4 border-t border-line space-y-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       bg-cobalt text-paper text-sm font-medium
                       hover:bg-cobalt/90 transition-colors duration-150"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="8" cy="6" r="2.5"/>
              <path d="M8 16C8 16 2.5 10.5 2.5 6a5.5 5.5 0 0111 0C13.5 10.5 8 16 8 16z" strokeLinejoin="round"/>
            </svg>
            Open in Google Maps
          </a>
          <p className="text-center text-[10px] font-mono text-ink-soft tracking-wide">Press Esc to close</p>
        </div>
      )}
    </div>
  );
}
