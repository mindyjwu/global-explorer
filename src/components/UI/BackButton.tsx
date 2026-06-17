import { useAppState } from '../../store/appState';

export function BackButton() {
  const { view, activeCountry, returnToGlobe } = useAppState();
  if (view !== 'country') return null;

  return (
    <button
      onClick={returnToGlobe}
      className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3 py-2 rounded-xl
                 bg-paper border border-line text-ink text-sm font-medium
                 shadow-sm hover:bg-paper-2 transition-colors duration-150 group"
      aria-label="Back to globe"
    >
      <svg
        className="w-4 h-4 text-cobalt group-hover:-translate-x-0.5 transition-transform duration-150"
        viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      >
        <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-cobalt font-mono text-xs tracking-widest uppercase">
        {activeCountry?.name ?? 'Globe'}
      </span>
    </button>
  );
}
