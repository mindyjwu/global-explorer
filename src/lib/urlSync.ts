import { useEffect, useRef } from 'react';
import { useAppState } from '../store/appState';
import { loadCities } from './cityData';
import { SUPPORTED_COUNTRIES } from './constants';
import type { InterestTag } from '../types';

const VALID_TAGS = new Set<string>(['nature', 'beaches', 'food-wine', 'history', 'shopping', 'nightlife']);

/**
 * Two-way sync between app state and the URL query string (?country=PT&tags=history,food-wine),
 * so country + filter combinations are shareable links. Restores state once on mount,
 * then keeps the URL updated (via replaceState, no new history entries) as state changes.
 */
export function useUrlSync() {
  const { view, activeCountry, activeFilters, beginFly, setCities, toggleFilter } = useAppState();
  const didRestore = useRef(false);

  // Restore from URL on initial mount
  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    const params = new URLSearchParams(window.location.search);
    const countryParam = params.get('country');
    const tagsParam = params.get('tags');

    const config = countryParam ? SUPPORTED_COUNTRIES[countryParam.toUpperCase()] : null;
    if (!config) return;

    beginFly(config);
    loadCities(config.citiesFile).then(setCities);

    if (tagsParam) {
      for (const tag of tagsParam.split(',')) {
        if (VALID_TAGS.has(tag)) toggleFilter(tag as InterestTag);
      }
    }
    // Restoration only runs once with the actions available at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync with state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (view === 'country' && activeCountry) {
      params.set('country', activeCountry.iso2);
      if (activeFilters.length > 0) {
        params.set('tags', activeFilters.join(','));
      }
    }
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [view, activeCountry, activeFilters]);
}
