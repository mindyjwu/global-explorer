import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppState } from '../../store/appState';
import { loadCities } from '../../lib/cityData';
import { SUPPORTED_COUNTRIES, MAP_STYLE, GLOBE_ZOOM, GLOBE_CENTER } from '../../lib/constants';
import type { City, InterestTag } from '../../types';

const TAG_COLORS: Record<InterestTag, string> = {
  nature:      '#2F8A6E',
  beaches:     '#2F948A',
  'food-wine': '#C99A3B',
  history:     '#2B5C9A',
  shopping:    '#9A5CB4',
  nightlife:   '#C56A3F',
};

function getPinColor(city: City): string {
  if (!city.content) return '#8B9BAD';
  const tag = city.content.tags[0];
  return TAG_COLORS[tag] ?? '#8B9BAD';
}

function makePinSvg(color: string, selected: boolean): string {
  const size = selected ? 40 : 28;
  const r = selected ? 10 : 7;
  const stroke = selected ? '#F5F2EC' : 'rgba(255,255,255,0.9)';
  const sw = selected ? 2.5 : 1.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>
    ${selected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r + 5}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>` : ''}
  </svg>`;
}

function svgToElement(svg: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = svg;
  return div.firstChild as HTMLElement;
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const flyingRef = useRef(false);

  const { view, activeCountry, cities, selectedCity, activeFilters, flyToCountry, selectCity } =
    useAppState();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: GLOBE_CENTER,
      zoom: GLOBE_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      map.setProjection({ type: 'globe' });

      // Country fill layer
      map.addSource('countries', {
        type: 'geojson',
        data: '/data/geo/countries-110m.geojson',
      });

      map.addLayer({
        id: 'country-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': [
            'case',
            ['in', ['get', 'iso2'], ['literal', Object.keys(SUPPORTED_COUNTRIES)]],
            '#C99A3B',
            '#D9D2C6',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.35,
            0.12,
          ],
        },
      });

      map.addLayer({
        id: 'country-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': [
            'case',
            ['in', ['get', 'iso2'], ['literal', Object.keys(SUPPORTED_COUNTRIES)]],
            '#C99A3B',
            '#C0B9AD',
          ],
          'line-width': [
            'case',
            ['in', ['get', 'iso2'], ['literal', Object.keys(SUPPORTED_COUNTRIES)]],
            1.2,
            0.5,
          ],
          'line-opacity': 0.6,
        },
      });

      // Hover state
      let hoveredId: string | number | null = null;
      map.on('mousemove', 'country-fill', (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = 'pointer';
        const feat = e.features[0];
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false });
        }
        hoveredId = feat.id ?? null;
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: true });
        }
      });

      map.on('mouseleave', 'country-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false });
        }
        hoveredId = null;
      });

      // Click country
      map.on('click', 'country-fill', async (e) => {
        if (!e.features?.length || flyingRef.current) return;
        const iso2 = e.features[0].properties?.iso2 as string;
        const config = SUPPORTED_COUNTRIES[iso2];
        if (!config) return;
        flyingRef.current = true;
        try {
          const loaded = await loadCities(config.citiesFile);
          flyToCountry(config, loaded);
        } finally {
          flyingRef.current = false;
        }
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [flyToCountry]);

  // Fly to country when view changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (view === 'country' && activeCountry) {
      map.flyTo({
        center: activeCountry.center,
        zoom: activeCountry.zoom,
        duration: 2200,
        essential: true,
      });
    } else if (view === 'globe') {
      map.flyTo({
        center: GLOBE_CENTER,
        zoom: GLOBE_ZOOM,
        duration: 2000,
        essential: true,
      });
    }
  }, [view, activeCountry]);

  // Render city markers
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (view !== 'country') return;

    cities.forEach((city) => {
      const isSelected = selectedCity?.id === city.id;
      const matchesFilter =
        activeFilters.length === 0 ||
        (city.content?.tags.some((t) => activeFilters.includes(t)) ?? false);

      const color = getPinColor(city);
      const el = svgToElement(makePinSvg(color, isSelected));
      el.style.cursor = 'pointer';
      el.style.opacity = matchesFilter ? '1' : '0.2';
      el.style.transition = 'opacity 0.25s ease';
      el.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
      el.style.zIndex = isSelected ? '10' : '1';

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectCity(isSelected ? null : city);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(city.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [view, cities, selectedCity, activeFilters, selectCity]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  return <div ref={mapContainer} className="absolute inset-0" />;
}
