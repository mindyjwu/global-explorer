import type { CountryConfig, InterestTag } from '../types';

export const SUPPORTED_COUNTRIES: Record<string, CountryConfig> = {
  PT: { iso2: 'PT', name: 'Portugal',  center: [-8.2,  39.5],  zoom: 6.5,  citiesFile: 'pt' },
  JP: { iso2: 'JP', name: 'Japan',     center: [137.0, 36.2],  zoom: 5.5,  citiesFile: 'jp' },
  IT: { iso2: 'IT', name: 'Italy',     center: [12.5,  42.5],  zoom: 6.0,  citiesFile: 'it' },
  CO: { iso2: 'CO', name: 'Colombia',  center: [-74.0, 4.5],   zoom: 6.0,  citiesFile: 'co' },
  MA: { iso2: 'MA', name: 'Morocco',   center: [-6.0,  31.8],  zoom: 6.0,  citiesFile: 'ma' },
};

export const ALL_TAGS: InterestTag[] = [
  'nature', 'beaches', 'food-wine', 'history', 'shopping', 'nightlife',
];

export const TAG_LABELS: Record<InterestTag, string> = {
  nature:    'Nature',
  beaches:   'Beaches',
  'food-wine': 'Food & Wine',
  history:   'History',
  shopping:  'Shopping',
  nightlife: 'Nightlife',
};

// OpenFreeMap liberty style — no API key required
export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export const GLOBE_ZOOM = 2.5;
export const GLOBE_CENTER: [number, number] = [10, 20];
