import { create } from 'zustand';
import type { City, InterestTag, AppView, CountryConfig } from '../types';

interface AppState {
  view: AppView;
  activeCountry: CountryConfig | null;
  cities: City[];
  selectedCity: City | null;
  activeFilters: InterestTag[];
  isLoading: boolean;
  mapReady: boolean;
  // actions
  beginFly: (country: CountryConfig) => void;
  setCities: (cities: City[] | null) => void;
  returnToGlobe: () => void;
  selectCity: (city: City | null) => void;
  toggleFilter: (tag: InterestTag) => void;
  clearFilters: () => void;
  setMapReady: () => void;
}

export const useAppState = create<AppState>((set) => ({
  view: 'globe',
  activeCountry: null,
  cities: [],
  selectedCity: null,
  activeFilters: [],
  isLoading: false,
  mapReady: false,

  // Atomically transitions to country view + marks loading in one set() call
  // so there's never a frame where view=country && !isLoading && cities=[] (empty state flash)
  beginFly: (country) =>
    set({ view: 'country', activeCountry: country, cities: [], selectedCity: null, isLoading: true }),

  setCities: (cities) =>
    set({ cities: cities ?? [], isLoading: false }),

  returnToGlobe: () =>
    set({ view: 'globe', activeCountry: null, cities: [], selectedCity: null, activeFilters: [], isLoading: false }),

  selectCity: (city) => set({ selectedCity: city }),

  // Flipped once when MapLibre reports the first complete render (hides the loader).
  setMapReady: () => set({ mapReady: true }),

  toggleFilter: (tag) =>
    set((s) => ({
      activeFilters: s.activeFilters.includes(tag)
        ? s.activeFilters.filter((t) => t !== tag)
        : [...s.activeFilters, tag],
      selectedCity: null,
    })),

  clearFilters: () => set({ activeFilters: [] }),
}));
