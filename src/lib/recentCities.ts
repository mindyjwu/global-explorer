import type { CountryConfig } from '../types';

const STORAGE_KEY = 'globalExplorer:recentCities';
const MAX_RECENTS = 5;

export interface RecentCity {
  cityId: string;
  cityName: string;
  displayName: string | null;
  region: string;
  country: CountryConfig;
}

export function getRecentCities(): RecentCity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentCity(entry: RecentCity): RecentCity[] {
  const existing = getRecentCities().filter((r) => r.cityId !== entry.cityId);
  const updated = [entry, ...existing].slice(0, MAX_RECENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — ignore
  }
  return updated;
}
