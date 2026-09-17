import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppState } from '../../store/appState';
import { loadCities } from '../../lib/cityData';
import { SUPPORTED_COUNTRIES, MAP_STYLE, GLOBE_ZOOM, GLOBE_CENTER } from '../../lib/constants';
import { registerContinentFly } from '../UI/ContinentNav';
import type { City, InterestTag } from '../../types';
import type { CountryConfig } from '../../types';

const TAG_COLORS: Record<InterestTag, string> = {
  nature:           '#2F8A6E',
  beaches:          '#2F948A',
  adventure:        '#4A7C59',
  'food-wine':      '#C99A3B',
  'street-food':    '#B86A2E',
  history:          '#2B5C9A',
  shopping:         '#9A5CB4',
  nightlife:        '#C56A3F',
  wonders:          '#7A4F2E',
  'national-parks': '#3A6B3A',
  wildlife:         '#8A6B1E',
  aurora:           '#4A2B7A',
  islands:          '#1E7A8A',
};

function getPinColor(city: City): string {
  if (!city.content) return '#8B9BAD';
  const tag = city.content.tags[0];
  return TAG_COLORS[tag] ?? '#8B9BAD';
}

function makePinSvg(color: string, selected: boolean, dimmed: boolean): string {
  const size = selected ? 40 : 28;
  const r = selected ? 10 : 7;
  const fill = dimmed ? '#C8C2B8' : color;
  const stroke = selected ? '#F5F2EC' : 'rgba(255,255,255,0.9)';
  const sw = selected ? 2.5 : 1.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
    ${selected ? `<circle cx="${size / 2}" cy="${size / 2}" r="${r + 5}" fill="none" stroke="${fill}" stroke-width="1.5" opacity="0.4"/>` : ''}
  </svg>`;
}

function svgToElement(svg: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = svg;
  return div.firstChild as HTMLElement;
}

function makePinElement(city: City, isSelected: boolean, dimmed: boolean): HTMLElement {
  const color = getPinColor(city);
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;';

  wrapper.appendChild(svgToElement(makePinSvg(color, isSelected, dimmed)));

  const label = document.createElement('div');
  label.textContent = city.content?.displayName ?? city.name;
  label.style.cssText = [
    'font-family:"Space Mono",monospace',
    'font-size:9px',
    'line-height:1.2',
    'color:#15243A',
    'background:rgba(245,242,236,0.88)',
    'padding:1px 5px',
    'border-radius:3px',
    'white-space:nowrap',
    'max-width:90px',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'pointer-events:none',
    `opacity:${dimmed ? 0.25 : isSelected ? 1 : 0.82}`,
    `font-weight:${isSelected ? 700 : 400}`,
    `box-shadow:${isSelected ? '0 1px 4px rgba(43,92,154,0.18)' : 'none'}`,
  ].join(';');
  wrapper.appendChild(label);

  return wrapper;
}

// Compute [minLng, minLat, maxLng, maxLat] from a GeoJSON feature's polygon coords.
// Only uses outer rings (index 0) to keep it fast.
function bboxFromFeature(feature: maplibregl.MapGeoJSONFeature): [number, number, number, number] | null {
  const geom = feature.geometry as { type: string; coordinates: unknown } | null;
  if (!geom) return null;

  let rings: [number, number][][] = [];
  if (geom.type === 'Polygon') {
    rings = [(geom.coordinates as [number, number][][])[0]];
  } else if (geom.type === 'MultiPolygon') {
    rings = (geom.coordinates as [number, number][][][]).map((p) => p[0]);
  } else {
    return null;
  }

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return minLng === Infinity ? null : [minLng, minLat, maxLng, maxLat];
}

// GeoJSON uses non-standard iso2 codes for some territories; map them to our city file names.
const CITIESFILE_OVERRIDES: Record<string, string> = {
  'CN-TW': 'tw',
};

function configFromFeature(iso2: string, name: string, feature: maplibregl.MapGeoJSONFeature): CountryConfig {
  const bbox = bboxFromFeature(feature);
  let center: [number, number] = [0, 0];
  let zoom = 5;

  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    const span = Math.max(maxLng - minLng, maxLat - minLat);
    zoom = span < 3 ? 8 : span < 8 ? 7 : span < 15 ? 6 : span < 30 ? 5.5 : span < 50 ? 4.5 : 4;
  }

  const citiesFile = CITIESFILE_OVERRIDES[iso2] ?? iso2.toLowerCase();
  return { iso2, name, center, zoom, citiesFile };
}

// Layers in the OpenFreeMap "liberty" base style to mute toward the paper/cobalt/turq
// palette instead of its default saturated blue water + bright green landcover.
const WATER_LAYERS = ['water'];
const LAND_LAYERS: Record<string, string> = {
  landcover_wood: '#D6E3CC',
  landcover_grass: '#DCE6CE',
  park: '#DCE6CE',
};
// Default labels (multi-script place names, roads, POIs) compete with our own
// city pins and country-name UI — hide them for a cleaner, custom-cartography look.
const HIDDEN_LAYER_PREFIXES = ['poi_', 'highway-name', 'highway-shield', 'road_shield', 'label_'];
const HIDDEN_LAYERS = ['airport', 'water_name_point_label', 'water_name_line_label', 'waterway_line_label'];

function restyleBasemap(map: maplibregl.Map) {
  map.setPaintProperty('background', 'background-color', '#F5F2EC');
  for (const id of WATER_LAYERS) {
    if (map.getLayer(id)) map.setPaintProperty(id, 'fill-color', '#C9DEE3');
  }
  for (const [id, color] of Object.entries(LAND_LAYERS)) {
    if (map.getLayer(id)) map.setPaintProperty(id, 'fill-color', color);
  }
  for (const layer of map.getStyle().layers) {
    const hide = HIDDEN_LAYERS.includes(layer.id) || HIDDEN_LAYER_PREFIXES.some((p) => layer.id.startsWith(p));
    if (hide) map.setLayoutProperty(layer.id, 'visibility', 'none');
  }
}

// Generates a latitude parallel as a dense LineString for correct globe rendering
function parallelLine(lat: number) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: Array.from({ length: 91 }, (_, i) => [i * 4 - 180, lat] as [number, number]),
    },
  };
}

function fc(...features: object[]) {
  return { type: 'FeatureCollection' as const, features };
}

// Adds geographic reference lines, ocean names, and country name labels
function addAnnotations(map: maplibregl.Map) {
  // --- Geographic reference lines (behind country fills) ---

  // Equator — solid cobalt blue
  map.addSource('anno-equator', { type: 'geojson', data: fc(parallelLine(0)) });
  map.addLayer({
    id: 'anno-equator', type: 'line', source: 'anno-equator', maxzoom: 6,
    paint: { 'line-color': '#2B5C9A', 'line-width': 1.2, 'line-opacity': 0.5 },
  });

  // Tropics of Cancer & Capricorn — amber dashed
  map.addSource('anno-tropics', { type: 'geojson', data: fc(parallelLine(23.44), parallelLine(-23.44)) });
  map.addLayer({
    id: 'anno-tropics', type: 'line', source: 'anno-tropics', maxzoom: 6,
    paint: { 'line-color': '#C99A3B', 'line-width': 0.9, 'line-opacity': 0.45, 'line-dasharray': [5, 4] },
  });

  // Arctic & Antarctic circles — green dotted
  map.addSource('anno-arctic', { type: 'geojson', data: fc(parallelLine(66.56), parallelLine(-66.56)) });
  map.addLayer({
    id: 'anno-arctic', type: 'line', source: 'anno-arctic', maxzoom: 6,
    paint: { 'line-color': '#4A7C59', 'line-width': 0.8, 'line-opacity': 0.4, 'line-dasharray': [2, 5] },
  });

  // --- Ocean, sea, and geo-line text labels ---
  const LABEL_POINTS = [
    // Major oceans
    { c: [-140,  5],   t: 'PACIFIC OCEAN',        k: 'ocean' },
    { c: [ -30, 12],   t: 'ATLANTIC OCEAN',        k: 'ocean' },
    { c: [  75,-25],   t: 'INDIAN OCEAN',           k: 'ocean' },
    { c: [   0, 83],   t: 'ARCTIC OCEAN',           k: 'ocean' },
    { c: [   0,-58],   t: 'SOUTHERN OCEAN',         k: 'ocean' },
    // Seas / gulfs
    { c: [  18, 36],   t: 'Mediterranean Sea',      k: 'sea' },
    { c: [ -75, 15],   t: 'Caribbean Sea',          k: 'sea' },
    { c: [ 114, 14],   t: 'South China Sea',        k: 'sea' },
    { c: [  40, 14],   t: 'Red Sea',                k: 'sea' },
    { c: [  51, 27],   t: 'Persian Gulf',           k: 'sea' },
    { c: [  30, 44],   t: 'Black Sea',              k: 'sea' },
    { c: [  25, 59],   t: 'Baltic Sea',             k: 'sea' },
    { c: [-100, 26],   t: 'Gulf of Mexico',         k: 'sea' },
    // Geographic line labels (placed at right edge near dateline)
    { c: [ 170,  1],   t: 'Equator',               k: 'geoline' },
    { c: [ 170, 24],   t: 'Tropic of Cancer',       k: 'geoline' },
    { c: [ 170,-24],   t: 'Tropic of Capricorn',    k: 'geoline' },
    { c: [ 170, 67],   t: 'Arctic Circle',          k: 'geoline' },
    { c: [ 170,-67],   t: 'Antarctic Circle',       k: 'geoline' },
  ];

  map.addSource('anno-labels', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: LABEL_POINTS.map(f => ({
        type: 'Feature' as const,
        properties: { label: f.t, kind: f.k },
        geometry: { type: 'Point' as const, coordinates: f.c },
      })),
    },
  });

  // Ocean names — large, spaced tracking, italic-style
  map.addLayer({
    id: 'anno-ocean-text', type: 'symbol', source: 'anno-labels',
    filter: ['==', ['get', 'kind'], 'ocean'],
    maxzoom: 5,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 1.5, 9, 4, 12],
      'text-letter-spacing': 0.2,
      'text-max-width': 10,
    },
    paint: {
      'text-color': '#1E4A7A',
      'text-opacity': 0.6,
      'text-halo-color': 'rgba(201,222,227,0.5)',
      'text-halo-width': 1.2,
    },
  });

  // Sea / gulf names — smaller
  map.addLayer({
    id: 'anno-sea-text', type: 'symbol', source: 'anno-labels',
    filter: ['==', ['get', 'kind'], 'sea'],
    minzoom: 2.5, maxzoom: 6,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
      'text-size': 8,
      'text-letter-spacing': 0.1,
      'text-max-width': 8,
    },
    paint: {
      'text-color': '#1E4A7A',
      'text-opacity': 0.5,
      'text-halo-color': 'rgba(201,222,227,0.4)',
      'text-halo-width': 1,
    },
  });

  // Geo line name labels
  map.addLayer({
    id: 'anno-geoline-text', type: 'symbol', source: 'anno-labels',
    filter: ['==', ['get', 'kind'], 'geoline'],
    maxzoom: 5,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular', 'Open Sans Regular'],
      'text-size': 7.5,
      'text-letter-spacing': 0.05,
      'text-anchor': 'left',
    },
    paint: {
      'text-color': '#2B5C9A',
      'text-opacity': 0.55,
      'text-halo-color': 'rgba(245,242,236,0.75)',
      'text-halo-width': 1.2,
    },
  });
}

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const flyingRef = useRef(false);

  // Expose a flyTo callback so ContinentNav can trigger continent-level camera moves
  useEffect(() => {
    registerContinentFly((center: [number, number], zoom: number) => {
      mapRef.current?.flyTo({ center, zoom, duration: 1800, essential: true });
    });
    return () => registerContinentFly(null);
  }, []);

  const { view, activeCountry, cities, selectedCity, activeFilters, beginFly, setCities, selectCity } =
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

    map.on('error', (e) => {
      console.error('[MapLibre]', e.error);
    });

    map.on('load', () => {
      map.resize();
      map.setProjection({ type: 'globe' });
      restyleBasemap(map);

      // Geographic lines + ocean/sea labels (drawn behind country fills)
      addAnnotations(map);

      map.addSource('countries', {
        type: 'geojson',
        data: '/data/geo/countries-110m.geojson',
        generateId: true,
      });

      // All countries are clickable now — uniform nature-toned styling
      map.addLayer({
        id: 'country-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': '#2F948A',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.28,
            0.06,
          ],
        },
      });

      map.addLayer({
        id: 'country-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': '#2B5C9A',
          'line-width': 0.8,
          'line-opacity': 0.35,
        },
      });

      // Country name labels — visible on globe view, fade out when zoomed in
      map.addLayer({
        id: 'country-labels',
        type: 'symbol',
        source: 'countries',
        maxzoom: 6.5,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold', 'Open Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 8, 4, 11, 6, 13],
          'text-max-width': 7,
          'text-padding': 4,
        },
        paint: {
          'text-color': '#15243A',
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 5.5, 1, 6.5, 0],
          'text-halo-color': 'rgba(245,242,236,0.88)',
          'text-halo-width': 1.8,
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

      // Universal click — works for any country
      map.on('click', 'country-fill', async (e) => {
        if (!e.features?.length || flyingRef.current) return;

        const feat = e.features[0];
        const iso2 = feat.properties?.iso2 as string | undefined;
        if (!iso2) return;

        const name = (feat.properties?.name as string | undefined) || iso2;
        const config = SUPPORTED_COUNTRIES[iso2] ?? configFromFeature(iso2, name, feat);

        flyingRef.current = true;
        beginFly(config); // atomically sets view=country + isLoading=true

        try {
          const loaded = await loadCities(config.citiesFile);
          setCities(loaded); // sets cities + isLoading=false
        } finally {
          flyingRef.current = false;
        }
      });
    });

    mapRef.current = map;

    // Resize observer: fires map.resize() the moment the container gets real dimensions,
    // which handles the case where Tailwind CSS loads after the map initializes.
    const ro = new ResizeObserver(() => { map.resize(); });
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [beginFly, setCities]);

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

      const dimmed = !matchesFilter;
      const el = makePinElement(city, isSelected, dimmed);
      el.style.cursor = dimmed ? 'default' : 'pointer';
      el.style.opacity = dimmed ? '0.18' : '1';
      el.style.transition = 'opacity 0.25s ease, transform 0.15s ease';
      el.style.transform = isSelected ? 'scale(1.2)' : dimmed ? 'scale(0.75)' : 'scale(1)';
      el.style.zIndex = isSelected ? '10' : dimmed ? '0' : '1';

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

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
    />
  );
}
