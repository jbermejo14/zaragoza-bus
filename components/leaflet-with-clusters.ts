import * as Leaflet from 'leaflet';
import './leaflet-global';
import 'leaflet.markercluster';

/**
 * Leaflet con `markerClusterGroup` disponible. El plugin se engancha al `L` global, que
 * `leaflet-global` ha fijado antes (el orden de los imports garantiza esa secuencia).
 */
export const L = (window as unknown as { L: typeof Leaflet }).L;
