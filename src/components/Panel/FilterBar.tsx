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

export function FilterBar() {
  const { view, activeFilters, toggleFilter, clearFilters } = useAppState();
  if (view !== 'country') return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 flex-wrap justify-center px-2">
      {ALL_TAGS.map((tag) => {
        const active = activeFilters.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium',
              'transition-all duration-150 cursor-pointer select-none',
              'font-mono tracking-wide uppercase',
              active
                ? 'bg-ink text-paper border-ink shadow-md'
                : 'bg-paper/90 text-ink-soft border-line hover:border-ink-soft backdrop-blur-sm',
            ].join(' ')}
          >
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
          Clear
        </button>
      )}
    </div>
  );
}
