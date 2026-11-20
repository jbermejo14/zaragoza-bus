'use client';

import type * as Leaflet from 'leaflet';
import { useEffect, useRef, type RefObject } from 'react';
import { LINE_PILL_HEIGHT_PX, lineFitPadding, shouldCloseStopForLine } from '../lib/line-selection';
import type { LineRoute } from '../lib/line-route';
import type { BusStop } from '../lib/types';
import { boundsOfPositions, fitMapToPadding } from './bus-map-layers';
import { DESKTOP_MEDIA_QUERY, measurePanelCover } from './map-viewport';

interface LineFramingOptions {
  mapRef: RefObject<Leaflet.Map | null>;
  routeLayerRef: RefObject<Leaflet.FeatureGroup | null>;
  panelRef: RefObject<HTMLElement | null>;
  /** Línea seleccionada (null = ninguna). */
  lineFilter: string | null;
  route: LineRoute | null;
  /** True cuando ya se sabe si hay recorrido (cargado o fallido); sin recorrido se encuadran los postes. */
  routeSettled: boolean;
  /** Postes de la línea. */
  stops: readonly BusStop[];
  selectedStop: BusStop | null;
}

/** Rellenos del encuadre de una línea con el estado actual del panel (la altura de la hoja es la declarada, la objetivo). */
function measureLineFitPadding(panel: HTMLElement | null) {
  const cover = measurePanelCover(panel);
  return lineFitPadding({
    isMobile: !window.matchMedia(DESKTOP_MEDIA_QUERY).matches,
    sheetHeightPx: cover.bottom,
    panelRightPx: cover.left,
    pillHeightPx: LINE_PILL_HEIGHT_PX,
  });
}

/**
 * Encuadra la línea elegida (su recorrido o, sin recorrido publicado, sus postes) una sola vez por línea.
 * Con un poste abierto que pasa por la línea no mueve el mapa (manda el poste); con uno que no pasa espera
 * a que se cierre. Quitar la línea no mueve el mapa.
 */
export function useLineFraming({
  mapRef,
  routeLayerRef,
  panelRef,
  lineFilter,
  route,
  routeSettled,
  stops,
  selectedStop,
}: LineFramingOptions): void {
  const framedLineRef = useRef<string | null>(null);
  const stopsRef = useRef(stops);

  useEffect(() => {
    stopsRef.current = stops;
  });

  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (lineFilter === null) {
      framedLineRef.current = null;
      return;
    }
    if (map === null || layer === null || framedLineRef.current === lineFilter) {
      return;
    }
    if (selectedStop !== null) {
      framedLineRef.current = shouldCloseStopForLine(selectedStop, lineFilter) ? null : lineFilter;
      return;
    }
    const bounds =
      route !== null
        ? layer.getBounds()
        : routeSettled
          ? boundsOfPositions(stopsRef.current.map((stop) => stop.coordinates))
          : null;
    if (bounds === null) {
      return;
    }
    framedLineRef.current = lineFilter;
    fitMapToPadding(map, bounds, measureLineFitPadding(panelRef.current));
  }, [mapRef, routeLayerRef, panelRef, lineFilter, route, routeSettled, selectedStop]);
}
