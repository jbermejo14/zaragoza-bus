import * as Leaflet from 'leaflet';

// leaflet.markercluster añade sus clases a `window.L`. Se publica una copia mutable porque el
// espacio de nombres importado puede ser inmutable según cómo el empaquetador resuelva Leaflet.
(window as unknown as { L: unknown }).L = { ...Leaflet };
