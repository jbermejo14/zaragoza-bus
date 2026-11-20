import * as L from 'leaflet';
import type * as Leaflet from 'leaflet';
import { clusterByGrid, type ScreenPoint } from '../lib/stop-clustering';
import type { BusStop } from '../lib/types';
import { boundsOfPositions, toLatLng } from './bus-map-layers';

/** Lado (px) de la celda de la rejilla de agrupación. */
export const STOP_CLUSTER_CELL_PX = 56;
/** Paradas mínimas en una celda para que se pinten agrupadas; con menos van sueltas. */
export const STOP_CLUSTER_MIN_SIZE = 5;
/** Desde este zoom (incluido) los postes nunca se agrupan. */
export const STOP_CLUSTER_MAX_ZOOM = 16;
/** Fracción en que se amplía la vista para elegir los postes que se pintan, para que no «salten» al mover el mapa. */
const VIEW_PADDING_RATIO = 0.2;
const CLUSTER_ICON_SIZE_PX = 44;

/** Capas y datos que necesita para pintar los postes de la vista actual. */
export interface StopPaintContext {
  map: Leaflet.Map;
  /** Marcador de cada poste, ya creado (se reutiliza entre repintados). */
  markers: ReadonlyMap<BusStop, Leaflet.CircleMarker>;
  stops: readonly BusStop[];
  /** True = agrupa según el zoom; false (poste abierto) = todos sueltos. */
  allowClustering: boolean;
  clusterLayer: Leaflet.LayerGroup;
  singlesLayer: Leaflet.LayerGroup;
  /** Se llama al pulsar un grupo con los límites de sus paradas. */
  onClusterClick: (bounds: Leaflet.LatLngBounds) => void;
}

function clusterIcon(stopCount: number): Leaflet.DivIcon {
  const label = document.createElement('span');
  label.textContent = String(stopCount);
  return L.divIcon({
    html: label,
    className: 'zb-cluster',
    iconSize: L.point(CLUSTER_ICON_SIZE_PX, CLUSTER_ICON_SIZE_PX),
  });
}

function centroid(stops: readonly BusStop[]): Leaflet.LatLngTuple {
  const total = stops.length;
  const latitude = stops.reduce((sum, stop) => sum + stop.coordinates.latitude, 0) / total;
  const longitude = stops.reduce((sum, stop) => sum + stop.coordinates.longitude, 0) / total;
  return [latitude, longitude];
}

function createClusterMarker(stops: readonly BusStop[], context: StopPaintContext): Leaflet.Marker {
  const marker = L.marker(centroid(stops), { icon: clusterIcon(stops.length), keyboard: false });
  marker.on('click', () => context.onClusterClick(boundsOfPositions(stops.map((stop) => stop.coordinates))));
  return marker;
}

/** Postes dentro de la vista ampliada un 20 %. */
function stopsInView(map: Leaflet.Map, stops: readonly BusStop[]): BusStop[] {
  const bounds = map.getBounds().pad(VIEW_PADDING_RATIO);
  return stops.filter((stop) => bounds.contains(toLatLng(stop.coordinates)));
}

/**
 * Repinta los postes de la vista: los grupos de `STOP_CLUSTER_MIN_SIZE` o más paradas por celda como un
 * icono con su número, y el resto sueltos. Las celdas se calculan en píxeles absolutos del zoom actual,
 * así que al desplazar el mapa los grupos no cambian.
 */
export function paintStops(context: StopPaintContext): void {
  const { map, markers, clusterLayer, singlesLayer } = context;
  clusterLayer.clearLayers();
  singlesLayer.clearLayers();
  if (!context.allowClustering) {
    context.stops.forEach((stop) => markers.get(stop)?.addTo(singlesLayer));
    return;
  }
  const zoom = map.getZoom();
  const visible = stopsInView(map, context.stops);
  if (zoom >= STOP_CLUSTER_MAX_ZOOM) {
    visible.forEach((stop) => markers.get(stop)?.addTo(singlesLayer));
    return;
  }
  const toScreen = (stop: BusStop): ScreenPoint => map.project(toLatLng(stop.coordinates), zoom);
  const { clusters, singles } = clusterByGrid(visible, toScreen, STOP_CLUSTER_CELL_PX, STOP_CLUSTER_MIN_SIZE);
  clusters.forEach((cluster) => createClusterMarker(cluster.items, context).addTo(clusterLayer));
  singles.forEach((stop) => markers.get(stop)?.addTo(singlesLayer));
}
