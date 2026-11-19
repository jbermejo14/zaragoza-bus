'use client';

import dynamic from 'next/dynamic';

/** Leaflet usa `window`: el mapa solo se carga en el navegador, nunca en la exportación estática. */
const BusMapLoader = dynamic(() => import('./BusMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-card" aria-hidden="true" />,
});

export default BusMapLoader;
