import type { City, CityGeo, CityContent } from '../types';
import type { CountryConfig } from '../types';
import { SUPPORTED_COUNTRIES } from './constants';
import editorial from '../data/content/cities-editorial.json';

const editorialMap = editorial as Record<string, CityContent>;

export interface SearchEntry {
  city: City;
  country: CountryConfig;
  /** Lowercase name for matching */
  searchName: string;
  /** Lowercase displayName (from editorial) for matching */
  searchDisplay: string | null;
}

let cache: SearchEntry[] | null = null;
let loading: Promise<SearchEntry[]> | null = null;

/**
 * Loads every city JSON file for all supported countries and builds a flat
 * search index. The result is cached after the first call.
 */
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

  // Load all country city files in parallel
  const countryConfigs = Object.values(SUPPORTED_COUNTRIES);
  const results = await Promise.allSettled(
    countryConfigs.map(async (config) => {
      const res = await fetch(`/data/cities/${config.citiesFile}.json`);
      if (!res.ok) return { config, cities: [] as City[] };
      const geoList: CityGeo[] = await res.json();
      const cities: City[] = geoList.map((geo) => ({
        ...geo,
        content: editorialMap[geo.id] ?? null,
      }));
      return { config, cities };
    }),
  );

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    const { config, cities } = result.value;
    for (const city of cities) {
      entries.push({
        city,
        country: config,
        searchName: city.name.toLowerCase(),
        searchDisplay: city.content?.displayName?.toLowerCase() ?? null,
      });
    }
  }

  return entries;
}

/**
 * Simple prefix/substring match, returns up to `limit` results.
 * Prefix matches on name or displayName are ranked first.
 */
export function searchCities(index: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const prefixMatches: SearchEntry[] = [];
  const substringMatches: SearchEntry[] = [];

  for (const entry of index) {
    const nameMatch = entry.searchName.startsWith(q);
    const displayMatch = entry.searchDisplay?.startsWith(q) ?? false;

    if (nameMatch || displayMatch) {
      prefixMatches.push(entry);
    } else if (
      entry.searchName.includes(q) ||
      (entry.searchDisplay?.includes(q) ?? false)
    ) {
      substringMatches.push(entry);
    }

    if (prefixMatches.length + substringMatches.length >= limit * 2) break;
  }

  // Sort each group by population (descending) for relevance
  const byPop = (a: SearchEntry, b: SearchEntry) => b.city.population - a.city.population;
  prefixMatches.sort(byPop);
  substringMatches.sort(byPop);

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}
