'use client';

import * as L from 'leaflet';
import type * as Leaflet from 'leaflet';
import { useEffect, useRef, type RefObject } from 'react';
import type { BusStop } from '../lib/types';
import { createStopCanvasRenderer, createStopMarker, stopStyle } from './bus-map-layers';
import type { MapColors } from './map-colors';
import { paintStops } from './stop-cluster-layer';

interface StopLayersOptions {
  mapRef: RefObject<Leaflet.Map | null>;
  /** Postes que se dibujan (con filtro de línea, solo los de esa línea). */
  stops: readonly BusStop[];
  /** Con un poste abierto no se agrupa: todos los postes van sueltos. */
  hasSelection: boolean;
  colors: MapColors;
  onSelectStop: (stop: BusStop) => void;
  /** Pulsar un grupo: encuadra los límites de sus paradas. */
  onClusterClick: (bounds: Leaflet.LatLngBounds) => void;
}

/**
 * Capas de postes del mapa: grupos (iconos con el número de paradas) y postes sueltos en canvas, repintados
 * en `zoomend`/`moveend`. Debe usarse después de crear el mapa (sus efectos leen `mapRef`).
 */
export function useStopLayers({ mapRef, stops, hasSelection, colors, onSelectStop, onClusterClick }: StopLayersOptions): void {
  const markersRef = useRef<Map<BusStop, Leaflet.CircleMarker>>(new Map());
  const colorsRef = useRef(colors);
  const onSelectStopRef = useRef(onSelectStop);
  const onClusterClickRef = useRef(onClusterClick);

  useEffect(() => {
    colorsRef.current = colors;
    onSelectStopRef.current = onSelectStop;
    onClusterClickRef.current = onClusterClick;
  });

  useEffect(() => {
    const map = mapRef.current;
    if (map === null) {
      return;
    }
    const clusterLayer = L.layerGroup().addTo(map);
    const singlesLayer = L.layerGroup().addTo(map);
    const renderer = createStopCanvasRenderer();
    const markers = new Map(
      stops.map((stop) => [
        stop,
        createStopMarker(stop, (selected) => onSelectStopRef.current(selected), colorsRef.current, renderer),
      ]),
    );
    markersRef.current = markers;
    const paint = () =>
      paintStops({
        map,
        markers,
        stops,
        allowClustering: !hasSelection,
        clusterLayer,
        singlesLayer,
        onClusterClick: (bounds) => onClusterClickRef.current(bounds),
      });
    paint();
    map.on('zoomend moveend', paint);
    return () => {
      map.off('zoomend moveend', paint);
      clusterLayer.remove();
      singlesLayer.remove();
      markersRef.current = new Map();
    };
  }, [mapRef, stops, hasSelection]);

  // Cambio de tema: se repintan los postes existentes sin recrearlos.
  useEffect(() => {
    markersRef.current.forEach((marker) => marker.setStyle(stopStyle(colors)));
  }, [colors]);
}
