import type { City, CityGeo, CityContent } from '../types';
import editorial from '../data/content/cities-editorial.json';

const editorialMap = editorial as Record<string, CityContent>;

export async function loadCities(countryFile: string): Promise<City[]> {
  const res = await fetch(`/data/cities/${countryFile}.json`);
  if (!res.ok) throw new Error(`Failed to load cities for ${countryFile}`);
  const geoList: CityGeo[] = await res.json();
  return geoList.map((geo) => ({
    ...geo,
    content: editorialMap[geo.id] ?? null,
  }));
}
