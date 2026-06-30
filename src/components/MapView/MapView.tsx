import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppState } from '../../store/appState';
import { loadCities } from '../../lib/cityData';
import { SUPPORTED_COUNTRIES, MAP_STYLE, GLOBE_ZOOM, GLOBE_CENTER } from '../../lib/constants';
import type { City, InterestTag } from '../../types';
import type { CountryConfig } from '../../types';

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

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const flyingRef = useRef(false);

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
      const color = getPinColor(city);
      const el = svgToElement(makePinSvg(color, isSelected, dimmed));
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
