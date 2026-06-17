import { useAppState } from '../../store/appState';
import { ALL_TAGS, TAG_LABELS } from '../../lib/constants';
import type { InterestTag } from '../../types';

const TAG_ICONS: Record<InterestTag, string> = {
  nature:      '🌿',
  beaches:     '🏖',
  'food-wine': '🍷',
  history:     '🏛',
  shopping:    '🛍',
  nightlife:   '✦',
};

const TAG_ACTIVE_COLORS: Record<InterestTag, { bg: string; border: string }> = {
  nature:      { bg: '#2F8A6E', border: '#2F8A6E' },
  beaches:     { bg: '#2F948A', border: '#2F948A' },
  'food-wine': { bg: '#C99A3B', border: '#C99A3B' },
  history:     { bg: '#2B5C9A', border: '#2B5C9A' },
  shopping:    { bg: '#9A5CB4', border: '#9A5CB4' },
  nightlife:   { bg: '#C56A3F', border: '#C56A3F' },
};

export function FilterBar() {
  const { view, activeFilters, toggleFilter, clearFilters } = useAppState();
  if (view !== 'country') return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 flex-wrap justify-center px-2">
      {ALL_TAGS.map((tag) => {
        const active = activeFilters.includes(tag);
        const colors = TAG_ACTIVE_COLORS[tag];
        return (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            style={active ? { backgroundColor: colors.bg, borderColor: colors.border, color: '#fff' } : {}}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono',
              'tracking-wide uppercase cursor-pointer select-none',
              'transition-all duration-200',
              active
                ? 'shadow-lg scale-105 font-semibold'
                : 'bg-paper/90 text-ink-soft border-line hover:border-ink-soft backdrop-blur-sm',
            ].join(' ')}
          >
            {active && (
              <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 flex-none" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 5l2.5 2.5L8 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span>{TAG_ICONS[tag]}</span>
            {TAG_LABELS[tag]}
          </button>
        );
      })}
      {activeFilters.length > 0 && (
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 rounded-full border border-line text-xs font-mono
                     text-ink-soft hover:text-ink hover:border-ink-soft transition-colors duration-150
                     bg-paper/90 backdrop-blur-sm uppercase tracking-wide"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
