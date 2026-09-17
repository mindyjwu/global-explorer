import type { City, CountryConfig } from '../types';

const KEY = 'globalExplorer:trip';

export interface TripCity {
  cityId: string;
  cityName: string;
  displayName: string | null;
  region: string;
  coordinates: [number, number];
  country: CountryConfig;
  savedAt: number;
}

export function getTripList(): TripCity[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function isSaved(cityId: string): boolean {
  return getTripList().some((c) => c.cityId === cityId);
}

export function addToTrip(city: City, country: CountryConfig): TripCity[] {
  const list = getTripList().filter((c) => c.cityId !== city.id);
  const entry: TripCity = {
    cityId: city.id,
    cityName: city.name,
    displayName: city.content?.displayName ?? null,
    region: city.region,
    coordinates: city.coordinates,
    country,
    savedAt: Date.now(),
  };
  const next = [entry, ...list];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function removeFromTrip(cityId: string): TripCity[] {
  const next = getTripList().filter((c) => c.cityId !== cityId);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function googleMapsUrl(coordinates: [number, number], name: string): string {
  const [lng, lat] = coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query=${lat},${lng}`;
}
