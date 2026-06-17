export type InterestTag = 'nature' | 'beaches' | 'food-wine' | 'history' | 'shopping' | 'nightlife';

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
