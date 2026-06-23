import type { City, CityGeo, CityContent } from '../types';
import editorial from '../data/content/cities-editorial.json';

const editorialMap = editorial as Record<string, CityContent>;

// Returns null when the city file doesn't exist (country not yet populated).
// Returns empty array only on unexpected parse errors.
export async function loadCities(countryFile: string): Promise<City[] | null> {
  try {
    const res = await fetch(`/data/cities/${countryFile}.json`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const geoList: CityGeo[] = await res.json();
    return geoList.map((geo) => ({
      ...geo,
      content: editorialMap[geo.id] ?? null,
    }));
  } catch {
    return null;
  }
}
