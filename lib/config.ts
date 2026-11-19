// Constantes de la aplicación. Contrato: ver ARCHITECTURE.md §3.

const TRANSPORT_API_BASE = 'https://www.zaragoza.es/sede/servicio/urbanismo-infraestructuras/transporte-urbano';
const API_BASE = `${TRANSPORT_API_BASE}/poste-autobus`;

/** Listado paginado de postes. La API devuelve como máximo 500 filas por página. */
export const STOP_LIST_URL = `${API_BASE}.json?srsname=wgs84`;
export const STOP_LIST_PAGE_SIZE = 500;

/** URL de los tiempos de paso de un poste. */
export function arrivalsUrl(stopId: string): string {
  return `${API_BASE}/${encodeURIComponent(stopId)}.json`;
}

/** URL del trazado de una línea (geometría oficial publicada en 2013). */
export function lineRouteUrl(line: string): string {
  return `${TRANSPORT_API_BASE}/linea-autobus/${encodeURIComponent(line)}.json?srsname=wgs84`;
}

/** Solo se muestran los postes del autobús urbano; los "rural-*" son de barrios rurales. */
export const URBAN_STOP_ID_PREFIX = 'tuzsa-';

export const REQUEST_TIMEOUT_MS = 8000;
export const AUTO_REFRESH_INTERVAL_MS = 30_000;

export const SEARCH_RESULT_LIMIT = 30;
export const NEARBY_STOP_LIMIT = 8;
export const NEARBY_MAX_DISTANCE_METERS = 1500;

export const FAVORITES_STORAGE_KEY = 'zarabus:favorites';

/** Centro de Zaragoza (plaza de España) para el mapa sin geolocalización. */
export const CITY_CENTER = { latitude: 41.6516, longitude: -0.8806 };
export const MAP_DEFAULT_ZOOM = 14;
export const MAP_SELECTED_ZOOM = 17;
/** Teselas estándar de OpenStreetMap (sin clave de API). */
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
