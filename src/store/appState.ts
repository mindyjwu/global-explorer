import { create } from 'zustand';
import type { City, InterestTag, AppView, CountryConfig } from '../types';

interface AppState {
  view: AppView;
  activeCountry: CountryConfig | null;
  cities: City[];
  selectedCity: City | null;
  activeFilters: InterestTag[];
  // actions
  flyToCountry: (country: CountryConfig, cities: City[]) => void;
  returnToGlobe: () => void;
  selectCity: (city: City | null) => void;
  toggleFilter: (tag: InterestTag) => void;
  clearFilters: () => void;
}

export const useAppState = create<AppState>((set) => ({
  view: 'globe',
  activeCountry: null,
  cities: [],
  selectedCity: null,
  activeFilters: [],

  flyToCountry: (country, cities) =>
    set({ view: 'country', activeCountry: country, cities, selectedCity: null }),

  returnToGlobe: () =>
    set({ view: 'globe', activeCountry: null, cities: [], selectedCity: null, activeFilters: [] }),

  selectCity: (city) => set({ selectedCity: city }),

  toggleFilter: (tag) =>
    set((s) => ({
      activeFilters: s.activeFilters.includes(tag)
        ? s.activeFilters.filter((t) => t !== tag)
        : [...s.activeFilters, tag],
      selectedCity: null,
    })),

  clearFilters: () => set({ activeFilters: [] }),
}));
