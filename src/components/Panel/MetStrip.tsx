import { useEffect, useState } from 'react';
import { useAppState } from '../../store/appState';

// "Art from here": the Met's own highlights tagged with the active country's
// geography, straight from its free, keyless open-access API. No AI involved.

const MET = 'https://collectionapi.metmuseum.org/public/collection/v1';
const COUNT = 5;
// Met department ids, in the order worth showing: European Paintings, Asian Art,
// Africa/Oceania/Americas, Islamic Art, Greek and Roman, Egyptian, American Wing,
// Modern and Contemporary, then everything.
const DEPT_ORDER: Array<number | null> = [11, 6, 5, 14, 13, 10, 1, 21, null];

// The Met catalogs by historical/regional names in a few cases.
const GEO_ALIAS: Record<string, string> = {
  'United Kingdom': 'England',
  'Czech Republic': 'Bohemia',
  'South Korea': 'Korea',
  'North Korea': 'Korea',
  'Myanmar': 'Burma',
  'Türkiye': 'Turkey',
  'Iran': 'Iran',
  'Vietnam': 'Vietnam',
  'Democratic Republic of the Congo': 'Democratic Republic of the Congo',
};

interface MetWork {
  id: number;
  title: string;
  artist: string;
  date: string;
  image: string;
  url: string;
}

interface MetObject {
  objectID: number;
  title?: string;
  artistDisplayName?: string;
  culture?: string;
  objectDate?: string;
  primaryImageSmall?: string;
  objectURL?: string;
}

const memo = new Map<string, MetWork[]>();

async function fetchHighlights(geo: string, signal: AbortSignal): Promise<MetWork[]> {
  const cacheKey = `met:${geo}`;
  if (memo.has(cacheKey)) return memo.get(cacheKey)!;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { const v = JSON.parse(cached) as MetWork[]; memo.set(cacheKey, v); return v; }
  } catch { /* storage unavailable */ }

  const works: MetWork[] = [];
  const seen = new Set<number>();
  // Paintings and sculpture first, so France leads with Ingres rather than an accordion;
  // an unfiltered pass fills in whatever's left. Sequential: the Met's bot shield dislikes bursts.
  for (const dept of DEPT_ORDER) {
    if (works.length >= COUNT) break;
    const q = `${MET}/search?geoLocation=${encodeURIComponent(geo)}${dept ? `&departmentId=${dept}` : ''}&hasImages=true&isHighlight=true&q=*`;
    const search = await fetch(q, { signal })
      .then(r => (r.ok ? r.json() : { objectIDs: [] }))
      .catch(() => ({ objectIDs: [] })) as { objectIDs: number[] | null };
    for (const id of (search.objectIDs ?? []).slice(0, 8)) {
      if (works.length >= COUNT) break;
      if (seen.has(id)) continue;
      seen.add(id);
      const o = await fetch(`${MET}/objects/${id}`, { signal })
        .then(r => (r.ok ? (r.json() as Promise<MetObject>) : null))
        .catch(() => null);
      if (!o?.primaryImageSmall || !o.objectURL) continue;
      works.push({
        id: o.objectID,
        title: o.title ?? 'Untitled',
        artist: o.artistDisplayName || o.culture || '',
        date: o.objectDate ?? '',
        image: o.primaryImageSmall,
        url: o.objectURL,
      });
    }
  }
  memo.set(cacheKey, works);
  try { sessionStorage.setItem(cacheKey, JSON.stringify(works)); } catch { /* ignore */ }
  return works;
}

export function MetStrip() {
  const { view, activeCountry } = useAppState();
  // Results are keyed by the geo they were fetched for, so switching country
  // shows skeletons until the new answer lands — no state reset needed in the effect.
  const [result, setResult] = useState<{ geo: string; works: MetWork[] } | null>(null);

  const name = activeCountry?.name ?? null;
  const geo = name ? (GEO_ALIAS[name] ?? name) : null;
  const works = result && result.geo === geo ? result.works : null;

  useEffect(() => {
    if (!geo) return;
    const controller = new AbortController();
    fetchHighlights(geo, controller.signal)
      .then(w => { if (!controller.signal.aborted) setResult({ geo, works: w }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ geo, works: [] }); });
    return () => controller.abort();
  }, [geo]);

  if (view !== 'country' || !geo) return null;
  if (works && works.length === 0) return null;

  return (
    <aside
      className="absolute left-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-2"
      aria-label={`Art from ${name} at The Met`}
    >
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink/50 bg-paper/70 backdrop-blur-sm px-2 py-1 rounded-full border border-line">
        From the Met
      </span>
      <div className="flex flex-col gap-2 p-2 rounded-2xl bg-paper/80 backdrop-blur-sm border border-line shadow-sm">
        {(works ?? Array.from({ length: COUNT }, () => null)).map((w, i) =>
          w ? (
            <a
              key={w.id}
              href={w.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${w.title}${w.artist ? ` — ${w.artist}` : ''}${w.date ? `, ${w.date}` : ''}`}
              className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-line bg-paper-2
                         transition-transform duration-200 hover:scale-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-cobalt"
            >
              <img src={w.image} alt={w.title} loading="lazy" className="w-full h-full object-cover" />
            </a>
          ) : (
            <div key={`s-${i}`} className="w-14 h-14 rounded-lg bg-line/50 animate-pulse" />
          ),
        )}
      </div>
      <a
        href={`https://www.metmuseum.org/art/collection/search?geolocation=${encodeURIComponent(geo)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[9px] tracking-[0.15em] uppercase text-cobalt hover:text-ink transition-colors"
      >
        More ↗
      </a>
    </aside>
  );
}
