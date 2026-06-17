import { useEffect } from 'react';
import { useAppState } from '../../store/appState';
import { TAG_LABELS } from '../../lib/constants';
import type { InterestTag } from '../../types';

const TAG_COLORS: Record<InterestTag, { bg: string; text: string }> = {
  nature:      { bg: 'bg-emerald-50',  text: 'text-emerald-800' },
  beaches:     { bg: 'bg-teal-50',     text: 'text-teal-800' },
  'food-wine': { bg: 'bg-amber-50',    text: 'text-amber-800' },
  history:     { bg: 'bg-blue-50',     text: 'text-blue-800' },
  shopping:    { bg: 'bg-purple-50',   text: 'text-purple-800' },
  nightlife:   { bg: 'bg-orange-50',   text: 'text-orange-800' },
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

              {/* Divider + meta */}
              <div className="mt-6 pt-5 border-t border-line">
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
