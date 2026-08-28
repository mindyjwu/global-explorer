export type InterestTag = 'nature' | 'beaches' | 'food-wine' | 'history' | 'shopping' | 'nightlife' | 'adventure' | 'street-food';

export interface CityGeo {
  id: string;
  name: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  population: number;
}

export interface CityContent {
  displayName: string;
  knownFor: string;
  tags: InterestTag[];
  source: 'curated' | 'llm' | 'wikipedia';
  stayDays?: { min: number; max: number };
  bestMonths?: number[];   // 1–12
  avgCostUSD?: number;     // per person per day
  avgTempC?: { low: number; high: number }; // annual range
  safetyRating?: number;   // 1–5
}

export interface City extends CityGeo {
  content: CityContent | null;
}

export interface CountryConfig {
  iso2: string;
  name: string;
  center: [number, number];
  zoom: number;
  citiesFile: string;
}

export type AppView = 'globe' | 'country';
