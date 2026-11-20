'use client';

import type * as Leaflet from 'leaflet';
import { useEffect, useRef, type RefObject } from 'react';
import { MAP_DEFAULT_ZOOM, MAP_SELECTED_ZOOM } from '../lib/config';
import type { BusVehicle } from '../lib/bus-vehicles';
import type { LineRoute } from '../lib/line-route';
import type { BusStop, Coordinates } from '../lib/types';
import {
  boundsOfPositions,
  createBaseMap,
  createClusterGroup,
  createRoutePolyline,
  createStopCanvasRenderer,
  createStopMarker,
  FRAME_MAX_VEHICLES,
  FRAME_MAX_ZOOM,
  fitMapToBounds,
  routeStyle,
  selectedStopStyle,
  stopStyle,
  toLatLng,
  userStyle,
} from './bus-map-layers';
import { framingPoints, vehiclesToFrame } from '../lib/vehicle-framing';
import { L } from './leaflet-with-clusters';
import { measurePanelCover } from './map-viewport';
import { createVehicleMarker } from './vehicle-layer';
import { useMapColors } from './use-map-colors';

interface BusMapProps {
  /** Postes que se dibujan: con filtro de línea, solo los de esa línea. */
  stops: readonly BusStop[];
  selectedStop: BusStop | null;
  userPosition: Coordinates | null;
  /** Línea del filtro activo (null = sin filtro); su recorrido o sus postes se encuadran. */
  lineFilter: string | null;
  route: LineRoute | null;
  /** True cuando ya se sabe si hay recorrido (cargado o fallido); sin recorrido se encuadran los postes. */
  routeSettled: boolean;
  /** Panel flotante: el mapa encuadra dejando libre el hueco que tapa. */
  panelRef: RefObject<HTMLElement | null>;
  /** Autobuses con GPS que se acercan al poste abierto (ya filtrados por línea); vacío = ninguno. */
  vehicles: readonly BusVehicle[];
  onSelectStop: (stop: BusStop) => void;
}

/** Mapa Leaflet con los postes (agrupados, o sueltos con un poste abierto), el recorrido, el poste seleccionado y la posición del usuario. */
export default function BusMap({
  stops,
  selectedStop,
  userPosition,
  lineFilter,
  route,
  routeSettled,
  panelRef,
  vehicles,
  onSelectStop,
}: BusMapProps) {
  const colors = useMapColors();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const clusterRef = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const plainStopsRef = useRef<Leaflet.LayerGroup | null>(null);
  const stopRendererRef = useRef<Leaflet.Canvas | null>(null);
  const framedStopRef = useRef<string | null>(null);
  const stopMarkersRef = useRef<Leaflet.CircleMarker[]>([]);
  const selectionLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const userLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const routeLayerRef = useRef<Leaflet.FeatureGroup | null>(null);
  const vehicleLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const colorsRef = useRef(colors);
  const stopsRef = useRef(stops);
  const selectedStopRef = useRef(selectedStop);
  const onSelectStopRef = useRef(onSelectStop);

  useEffect(() => {
    colorsRef.current = colors;
    stopsRef.current = stops;
    selectedStopRef.current = selectedStop;
    onSelectStopRef.current = onSelectStop;
  });

  // Solo lee refs (el mapa y el panel), por eso los efectos que lo usan no lo declaran como dependencia.
  const fitTo = (bounds: Leaflet.LatLngBounds, maxZoom?: number) => {
    const map = mapRef.current;
    if (map !== null) {
      fitMapToBounds(map, bounds, measurePanelCover(panelRef.current), maxZoom);
    }
  };

  // El mapa se crea una sola vez; el resto de efectos solo actualizan sus capas.
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const map = createBaseMap(container);
    routeLayerRef.current = L.featureGroup().addTo(map);
    clusterRef.current = createClusterGroup().addTo(map);
    plainStopsRef.current = L.layerGroup().addTo(map);
    stopRendererRef.current = createStopCanvasRenderer();
    selectionLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    vehicleLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      plainStopsRef.current = null;
      stopRendererRef.current = null;
      routeLayerRef.current = null;
      selectionLayerRef.current = null;
      userLayerRef.current = null;
      vehicleLayerRef.current = null;
      stopMarkersRef.current = [];
    };
  }, []);

  // Con un poste abierto los postes van sueltos (canvas); sin poste, agrupados. Cada modo recrea sus marcadores
  // porque el renderizador de un círculo se fija al añadirlo al mapa.
  const hasSelection = selectedStop !== null;
  useEffect(() => {
    const cluster = clusterRef.current;
    const plain = plainStopsRef.current;
    if (cluster === null || plain === null) {
      return;
    }
    const renderer = hasSelection ? (stopRendererRef.current ?? undefined) : undefined;
    const markers = stops.map((stop) =>
      createStopMarker(stop, (selected) => onSelectStopRef.current(selected), colorsRef.current, renderer),
    );
    stopMarkersRef.current = markers;
    cluster.clearLayers();
    plain.clearLayers();
    if (hasSelection) {
      markers.forEach((marker) => marker.addTo(plain));
    } else {
      cluster.addLayers(markers);
    }
    return () => {
      cluster.clearLayers();
      plain.clearLayers();
    };
  }, [stops, hasSelection]);

  // Cambio de tema: se repintan las capas existentes sin recrear el mapa ni los marcadores.
  useEffect(() => {
    stopMarkersRef.current.forEach((marker) => marker.setStyle(stopStyle(colors)));
    routeLayerRef.current?.setStyle(routeStyle(colors));
    selectionLayerRef.current?.eachLayer((layer) => (layer as Leaflet.CircleMarker).setStyle(selectedStopStyle(colors)));
    userLayerRef.current?.eachLayer((layer) => (layer as Leaflet.CircleMarker).setStyle(userStyle(colors)));
  }, [colors]);

  useEffect(() => {
    const layer = routeLayerRef.current;
    if (layer === null) {
      return;
    }
    layer.clearLayers();
    route?.paths.forEach((path) => createRoutePolyline(path, colorsRef.current).addTo(layer));
  }, [route]);

  // Encuadre del filtro de línea: su recorrido o, si no lo hay, sus postes. Con un poste abierto la vista ya está en él.
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (layer === null || lineFilter === null || selectedStopRef.current !== null) {
      return;
    }
    if (route !== null) {
      fitTo(layer.getBounds());
    } else if (routeSettled) {
      fitTo(boundsOfPositions(stopsRef.current.map((stop) => stop.coordinates)));
    }
  }, [lineFilter, route, routeSettled]);

  useEffect(() => {
    const layer = selectionLayerRef.current;
    if (layer === null) {
      return;
    }
    layer.clearLayers();
    if (selectedStop === null) {
      return;
    }
    L.circleMarker(toLatLng(selectedStop.coordinates), selectedStopStyle(colorsRef.current)).addTo(layer);
    fitTo(boundsOfPositions([selectedStop.coordinates]), MAP_SELECTED_ZOOM);
  }, [selectedStop]);

  useEffect(() => {
    const layer = userLayerRef.current;
    if (layer === null) {
      return;
    }
    layer.clearLayers();
    if (userPosition === null) {
      return;
    }
    L.circleMarker(toLatLng(userPosition), userStyle(colorsRef.current)).addTo(layer);
    fitTo(boundsOfPositions([userPosition]), MAP_DEFAULT_ZOOM);
  }, [userPosition]);

  // Los autobuses se repintan enteros en cada actualización: son pocos y cambian de posición.
  useEffect(() => {
    const layer = vehicleLayerRef.current;
    if (layer === null) {
      return;
    }
    layer.clearLayers();
    vehicles.forEach((vehicle) => createVehicleMarker(L, vehicle).addTo(layer));
  }, [vehicles]);

  // Cada apertura de poste (o cierre) permite un nuevo encuadre con autobuses.
  useEffect(() => {
    framedStopRef.current = null;
  }, [selectedStop]);

  // Una vez por poste abierto, cuando llegan sus autobuses: encuadra el poste y los más próximos.
  useEffect(() => {
    if (selectedStop === null || framedStopRef.current === selectedStop.number) {
      return;
    }
    const nearest = vehiclesToFrame(vehicles, lineFilter, FRAME_MAX_VEHICLES);
    if (nearest.length === 0) {
      return;
    }
    framedStopRef.current = selectedStop.number;
    fitTo(boundsOfPositions(framingPoints(selectedStop, nearest)), FRAME_MAX_ZOOM);
  }, [selectedStop, vehicles, lineFilter]);

  return <div ref={containerRef} className="absolute inset-0" role="region" aria-label="Mapa de postes" />;
}
