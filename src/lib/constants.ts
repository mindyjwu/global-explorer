import type { CountryConfig, InterestTag } from '../types';

export const SUPPORTED_COUNTRIES: Record<string, CountryConfig> = {
  // Europe & Africa (original 5)
  PT: { iso2: 'PT', name: 'Portugal',    center: [-8.2,   39.5],  zoom: 6.5,  citiesFile: 'pt' },
  JP: { iso2: 'JP', name: 'Japan',       center: [137.0,  36.2],  zoom: 5.5,  citiesFile: 'jp' },
  IT: { iso2: 'IT', name: 'Italy',       center: [12.5,   42.5],  zoom: 6.0,  citiesFile: 'it' },
  CO: { iso2: 'CO', name: 'Colombia',    center: [-74.0,  4.5],   zoom: 6.0,  citiesFile: 'co' },
  MA: { iso2: 'MA', name: 'Morocco',     center: [-6.0,   31.8],  zoom: 6.0,  citiesFile: 'ma' },
  // Asia
  TH: { iso2: 'TH', name: 'Thailand',   center: [101.0,  13.0],  zoom: 5.5,  citiesFile: 'th' },
  VN: { iso2: 'VN', name: 'Vietnam',    center: [106.0,  16.5],  zoom: 5.5,  citiesFile: 'vn' },
  ID: { iso2: 'ID', name: 'Indonesia',  center: [117.0,  -2.5],  zoom: 4.8,  citiesFile: 'id' },
  IN: { iso2: 'IN', name: 'India',      center: [80.0,   22.0],  zoom: 4.5,  citiesFile: 'in' },
  KR: { iso2: 'KR', name: 'South Korea',center: [127.5,  36.5],  zoom: 7.0,  citiesFile: 'kr' },
  KH: { iso2: 'KH', name: 'Cambodia',   center: [104.9,  12.5],  zoom: 7.0,  citiesFile: 'kh' },
  // North America
  MX: { iso2: 'MX', name: 'Mexico',     center: [-102.0, 23.5],  zoom: 5.5,  citiesFile: 'mx' },
  US: { iso2: 'US', name: 'USA',         center: [-98.0,  39.5],  zoom: 4.0,  citiesFile: 'us' },
  CR: { iso2: 'CR', name: 'Costa Rica', center: [-84.0,  10.0],  zoom: 7.5,  citiesFile: 'cr' },
  // South America
  PE: { iso2: 'PE', name: 'Peru',        center: [-76.0,  -9.5],  zoom: 5.8,  citiesFile: 'pe' },
  AR: { iso2: 'AR', name: 'Argentina',  center: [-64.0, -35.0],  zoom: 4.5,  citiesFile: 'ar' },
  BR: { iso2: 'BR', name: 'Brazil',     center: [-53.0, -14.0],  zoom: 4.5,  citiesFile: 'br' },
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
