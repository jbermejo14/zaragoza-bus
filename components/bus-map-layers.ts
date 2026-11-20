import type * as Leaflet from 'leaflet';
import { CITY_CENTER, MAP_ATTRIBUTION, MAP_DEFAULT_ZOOM, MAP_TILE_URL } from '../lib/config';
import type { BusStop, Coordinates } from '../lib/types';
import * as L from 'leaflet';
import type { MapColors } from './map-colors';
import { computeFitPadding, hasUsableSpace, type FitPadding, type PanelCover } from './map-viewport';
import { VEHICLE_PANE, VEHICLE_PANE_Z_INDEX } from './vehicle-layer';

const ROUTE_PANE = 'zb-route';
/** Por debajo del panel de vectores (400), donde están los postes, para que sigan siendo pulsables. */
const ROUTE_PANE_Z_INDEX = 390;
const ROUTE_WEIGHT = 4;
const ROUTE_OPACITY = 0.75;

/** Encima de los postes (vector 400) y del recorrido; el poste seleccionado nunca queda tapado. */
const SELECTED_PANE = 'zb-selected';
const SELECTED_PANE_Z_INDEX = 450;

const STOP_RADIUS = 8;
const SELECTED_STOP_RADIUS = 13;
const USER_RADIUS = 8;
const STOP_BORDER_WEIGHT = 2.5;
/** Anillo rojo grueso del seleccionado (su centro es del color de fondo del tema). */
const SELECTED_BORDER_WEIGHT = 6;
const FILL_OPACITY = 1;
/** Margen extra de toque (px) de los postes en canvas, donde no hay un círculo SVG que pulsar. */
const STOP_CANVAS_TOLERANCE_PX = 8;
const MAP_MAX_ZOOM = 19;

/** Autobuses que se encuadran junto al poste al abrirlo. */
export const FRAME_MAX_VEHICLES = 3;
/** Zoom máximo al encuadrar poste y autobuses (el mismo nivel de calle que al abrir un poste). */
export const FRAME_MAX_ZOOM = 17;

export function toLatLng(position: Coordinates): Leaflet.LatLngTuple {
  return [position.latitude, position.longitude];
}

/** Mapa con las teselas OSM, el zoom arriba a la derecha (el panel ocupa la izquierda) y el panel del recorrido. */
export function createBaseMap(container: HTMLElement): Leaflet.Map {
  const map = L.map(container, { zoomControl: false }).setView(toLatLng(CITY_CENTER), MAP_DEFAULT_ZOOM);
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.tileLayer(MAP_TILE_URL, { attribution: MAP_ATTRIBUTION, maxZoom: MAP_MAX_ZOOM }).addTo(map);
  map.createPane(ROUTE_PANE).style.zIndex = String(ROUTE_PANE_Z_INDEX);
  map.createPane(SELECTED_PANE).style.zIndex = String(SELECTED_PANE_Z_INDEX);
  map.createPane(VEHICLE_PANE).style.zIndex = String(VEHICLE_PANE_Z_INDEX);
  return map;
}

/** Renderizador canvas para los postes sin agrupar: ~1000 círculos pesarían mucho como SVG. */
export function createStopCanvasRenderer(): Leaflet.Canvas {
  return L.canvas({ tolerance: STOP_CANVAS_TOLERANCE_PX });
}

export function stopStyle(colors: MapColors): Leaflet.CircleMarkerOptions {
  return {
    radius: STOP_RADIUS,
    fillColor: colors.stop,
    fillOpacity: FILL_OPACITY,
    color: colors.stopBorder,
    weight: STOP_BORDER_WEIGHT,
  };
}

export function selectedStopStyle(colors: MapColors): Leaflet.CircleMarkerOptions {
  return {
    radius: SELECTED_STOP_RADIUS,
    // Diana: centro del color de fondo y anillo rojo grueso, distinta de los postes macizos.
    fillColor: colors.stopBorder,
    fillOpacity: FILL_OPACITY,
    color: colors.selected,
    weight: SELECTED_BORDER_WEIGHT,
    pane: SELECTED_PANE,
    interactive: false,
  };
}

export function userStyle(colors: MapColors): Leaflet.CircleMarkerOptions {
  return {
    radius: USER_RADIUS,
    fillColor: colors.user,
    fillOpacity: FILL_OPACITY,
    color: colors.stopBorder,
    weight: STOP_BORDER_WEIGHT,
    interactive: false,
  };
}

export function routeStyle(colors: MapColors): Leaflet.PolylineOptions {
  return { color: colors.route, weight: ROUTE_WEIGHT, opacity: ROUTE_OPACITY };
}

export function createRoutePolyline(path: Coordinates[], colors: MapColors): Leaflet.Polyline {
  return L.polyline(path.map(toLatLng), { ...routeStyle(colors), pane: ROUTE_PANE, interactive: false });
}

export function createStopMarker(
  stop: BusStop,
  onSelect: (stop: BusStop) => void,
  colors: MapColors,
  renderer?: Leaflet.Renderer,
): Leaflet.CircleMarker {
  const marker = L.circleMarker(toLatLng(stop.coordinates), { ...stopStyle(colors), renderer });
  marker.bindTooltip(`(${stop.number}) ${stop.name}`, { className: 'stop-tooltip' });
  marker.on('click', () => onSelect(stop));
  return marker;
}

/**
 * Encuadra los límites dejando libre el hueco del panel. Si no queda espacio útil (pestaña oculta,
 * ventana diminuta) no hace nada: Leaflet saltaría al zoom máximo.
 */
export function fitMapToBounds(
  map: Leaflet.Map,
  bounds: Leaflet.LatLngBounds,
  cover: PanelCover,
  maxZoom?: number,
): void {
  fitMapToPadding(map, bounds, computeFitPadding(cover), maxZoom);
}

/** Como `fitMapToBounds`, con el relleno ya calculado (p. ej. el de una línea, que reserva también la píldora). */
export function fitMapToPadding(
  map: Leaflet.Map,
  bounds: Leaflet.LatLngBounds,
  padding: FitPadding,
  maxZoom?: number,
): void {
  map.invalidateSize();
  if (!bounds.isValid() || !hasUsableSpace(map.getSize(), padding)) {
    return;
  }
  map.fitBounds(bounds, { paddingTopLeft: padding.topLeft, paddingBottomRight: padding.bottomRight, maxZoom });
}

/** Límites que contienen todos los puntos dados (inválidos si no hay ninguno). */
export function boundsOfPositions(positions: readonly Coordinates[]): Leaflet.LatLngBounds {
  return L.latLngBounds(positions.map(toLatLng));
}
