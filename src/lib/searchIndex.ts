import type { City, CityContent } from '../types';
import type { CountryConfig } from '../types';
import { SUPPORTED_COUNTRIES } from './constants';
import editorial from '../data/content/cities-editorial.json';

const editorialMap = editorial as Record<string, CityContent>;

export interface CitySearchEntry {
  type: 'city';
  city: City;
  country: CountryConfig;
  searchName: string;
  searchDisplay: string | null;
}

export interface CountrySearchEntry {
  type: 'country';
  country: CountryConfig;
  searchName: string;
}

export type SearchEntry = CitySearchEntry | CountrySearchEntry;

interface IndexCity {
  id: string; n: string; d: string | null; r: string;
  co: [number, number]; c: string; cn: string;
}

let cache: SearchEntry[] | null = null;
let loading: Promise<SearchEntry[]> | null = null;

export async function getSearchIndex(): Promise<SearchEntry[]> {
  if (cache) return cache;
  if (loading) return loading;
  loading = buildIndex();
  cache = await loading;
  loading = null;
  return cache;
}

async function buildIndex(): Promise<SearchEntry[]> {
  const entries: SearchEntry[] = [];

  // Country entries first
  const countryConfigs = Object.values(SUPPORTED_COUNTRIES);
  for (const config of countryConfigs) {
    entries.push({ type: 'country', country: config, searchName: config.name.toLowerCase() });
  }

  // Load the pre-built flat index (one request, ~135 KB) instead of 111 separate files
  const res = await fetch('/data/cities-index.json');
  if (!res.ok) return entries;
  const index: IndexCity[] = await res.json();

  for (const item of index) {
    const country = SUPPORTED_COUNTRIES[item.c];
    if (!country) continue;
    const city: City = {
      id: item.id,
      name: item.n,
      region: item.r,
      coordinates: item.co,
      population: 0,
      content: editorialMap[item.id] ?? null,
    };
    entries.push({
      type: 'city',
      city,
      country,
      searchName: item.n.toLowerCase(),
      searchDisplay: (item.d ?? item.n).toLowerCase(),
    });
  }

  return entries;
}

export function searchCities(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const prefixMatches: SearchEntry[] = [];
  const substringMatches: SearchEntry[] = [];

  for (const entry of index) {
    const displayMatch = entry.type === 'city' ? (entry.searchDisplay?.startsWith(q) ?? false) : false;
    const nameMatch = entry.searchName.startsWith(q);

    if (nameMatch || displayMatch) {
      prefixMatches.push(entry);
    } else if (
      entry.searchName.includes(q) ||
      (entry.type === 'city' && (entry.searchDisplay?.includes(q) ?? false))
    ) {
      substringMatches.push(entry);
    }

    if (prefixMatches.length + substringMatches.length >= limit * 4) break;
  }

  const byRelevance = (a: SearchEntry, b: SearchEntry) => {
    if (a.type === 'country' && b.type !== 'country') return -1;
    if (b.type === 'country' && a.type !== 'country') return 1;
    if (a.type === 'city' && b.type === 'city') return b.city.population - a.city.population;
    return 0;
  };
  prefixMatches.sort(byRelevance);
  substringMatches.sort(byRelevance);

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}
