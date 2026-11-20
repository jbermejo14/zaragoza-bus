import type * as Leaflet from 'leaflet';
import { CITY_CENTER, MAP_ATTRIBUTION, MAP_DEFAULT_ZOOM, MAP_TILE_URL } from '../lib/config';
import type { BusStop, Coordinates } from '../lib/types';
import { L } from './leaflet-with-clusters';
import type { MapColors } from './map-colors';
import { computeFitPadding, hasUsableSpace, type PanelCover } from './map-viewport';
import { VEHICLE_PANE, VEHICLE_PANE_Z_INDEX } from './vehicle-layer';

const ROUTE_PANE = 'zb-route';
/** Por debajo del panel de vectores (400), donde están los postes, para que sigan siendo pulsables. */
const ROUTE_PANE_Z_INDEX = 390;
const ROUTE_WEIGHT = 4;
const ROUTE_OPACITY = 0.75;

const STOP_RADIUS = 6;
const SELECTED_STOP_RADIUS = 11;
const USER_RADIUS = 8;
const STOP_BORDER_WEIGHT = 2;
const SELECTED_BORDER_WEIGHT = 3;
const FILL_OPACITY = 1;
const CLUSTER_ICON_SIZE_PX = 38;
const CLUSTER_MAX_RADIUS_PX = 50;
const MAP_MAX_ZOOM = 19;

export function toLatLng(position: Coordinates): Leaflet.LatLngTuple {
  return [position.latitude, position.longitude];
}

/** Mapa con las teselas OSM, el zoom arriba a la derecha (el panel ocupa la izquierda) y el panel del recorrido. */
export function createBaseMap(container: HTMLElement): Leaflet.Map {
  const map = L.map(container, { zoomControl: false }).setView(toLatLng(CITY_CENTER), MAP_DEFAULT_ZOOM);
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.tileLayer(MAP_TILE_URL, { attribution: MAP_ATTRIBUTION, maxZoom: MAP_MAX_ZOOM }).addTo(map);
  map.createPane(ROUTE_PANE).style.zIndex = String(ROUTE_PANE_Z_INDEX);
  map.createPane(VEHICLE_PANE).style.zIndex = String(VEHICLE_PANE_Z_INDEX);
  return map;
}

export function createClusterGroup(): Leaflet.MarkerClusterGroup {
  return L.markerClusterGroup({
    maxClusterRadius: CLUSTER_MAX_RADIUS_PX,
    showCoverageOnHover: false,
    iconCreateFunction: (cluster) =>
      L.divIcon({
        html: `<span>${cluster.getChildCount()}</span>`,
        className: 'zb-cluster',
        iconSize: L.point(CLUSTER_ICON_SIZE_PX, CLUSTER_ICON_SIZE_PX),
      }),
  });
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
    fillColor: colors.selected,
    fillOpacity: FILL_OPACITY,
    color: colors.stopBorder,
    weight: SELECTED_BORDER_WEIGHT,
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
): Leaflet.CircleMarker {
  const marker = L.circleMarker(toLatLng(stop.coordinates), stopStyle(colors));
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
  map.invalidateSize();
  const padding = computeFitPadding(cover);
  if (!bounds.isValid() || !hasUsableSpace(map.getSize(), padding)) {
    return;
  }
  map.fitBounds(bounds, { paddingTopLeft: padding.topLeft, paddingBottomRight: padding.bottomRight, maxZoom });
}

/** Límites que contienen todos los puntos dados (inválidos si no hay ninguno). */
export function boundsOfPositions(positions: readonly Coordinates[]): Leaflet.LatLngBounds {
  return L.latLngBounds(positions.map(toLatLng));
}
