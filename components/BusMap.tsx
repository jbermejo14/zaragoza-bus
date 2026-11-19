'use client';

import type * as Leaflet from 'leaflet';
import { useEffect, useRef } from 'react';
import {
  CITY_CENTER,
  MAP_ATTRIBUTION,
  MAP_DEFAULT_ZOOM,
  MAP_SELECTED_ZOOM,
  MAP_TILE_URL,
} from '../lib/config';
import type { BusStop, Coordinates } from '../lib/types';
import { L } from './leaflet-with-clusters';

interface BusMapProps {
  stops: readonly BusStop[];
  selectedStop: BusStop | null;
  userPosition: Coordinates | null;
  onSelectStop: (stop: BusStop) => void;
}

const COLOR_ACCENT = '#DC2626';
const COLOR_WHITE = '#FFFFFF';
const COLOR_USER = '#2563EB';
const STOP_RADIUS = 6;
const SELECTED_STOP_RADIUS = 11;
const USER_RADIUS = 8;
const STOP_BORDER_WEIGHT = 2;
const SELECTED_BORDER_WEIGHT = 3;
const FILL_OPACITY = 1;
const CLUSTER_ICON_SIZE_PX = 38;
const CLUSTER_MAX_RADIUS_PX = 50;
const MAP_MAX_ZOOM = 19;

function toLatLng(position: Coordinates): Leaflet.LatLngTuple {
  return [position.latitude, position.longitude];
}

function createBaseMap(container: HTMLElement): Leaflet.Map {
  const map = L.map(container).setView(toLatLng(CITY_CENTER), MAP_DEFAULT_ZOOM);
  L.tileLayer(MAP_TILE_URL, { attribution: MAP_ATTRIBUTION, maxZoom: MAP_MAX_ZOOM }).addTo(map);
  return map;
}

function createClusterGroup(): Leaflet.MarkerClusterGroup {
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

function createStopMarker(stop: BusStop, onSelect: (stop: BusStop) => void): Leaflet.CircleMarker {
  const marker = L.circleMarker(toLatLng(stop.coordinates), {
    radius: STOP_RADIUS,
    fillColor: COLOR_ACCENT,
    fillOpacity: FILL_OPACITY,
    color: COLOR_WHITE,
    weight: STOP_BORDER_WEIGHT,
  });
  marker.bindTooltip(`(${stop.number}) ${stop.name}`, { className: 'stop-tooltip' });
  marker.on('click', () => onSelect(stop));
  return marker;
}

/** Mapa Leaflet con los postes agrupados, el poste seleccionado resaltado y la posición del usuario. */
export default function BusMap({ stops, selectedStop, userPosition, onSelectStop }: BusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const clusterRef = useRef<Leaflet.MarkerClusterGroup | null>(null);
  const selectionLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const userLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const onSelectStopRef = useRef(onSelectStop);

  useEffect(() => {
    onSelectStopRef.current = onSelectStop;
  });

  // El mapa se crea una sola vez; el resto de efectos solo actualizan sus capas.
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const map = createBaseMap(container);
    clusterRef.current = createClusterGroup().addTo(map);
    selectionLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    // En móvil el contenedor está oculto hasta pulsar «Mapa»: hay que recalcular su tamaño al mostrarse.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      selectionLayerRef.current = null;
      userLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (cluster === null) {
      return;
    }
    cluster.clearLayers();
    cluster.addLayers(stops.map((stop) => createStopMarker(stop, (selected) => onSelectStopRef.current(selected))));
  }, [stops]);

  useEffect(() => {
    const layer = selectionLayerRef.current;
    const map = mapRef.current;
    if (layer === null || map === null) {
      return;
    }
    layer.clearLayers();
    if (selectedStop === null) {
      return;
    }
    const center = toLatLng(selectedStop.coordinates);
    L.circleMarker(center, {
      radius: SELECTED_STOP_RADIUS,
      fillColor: COLOR_ACCENT,
      fillOpacity: FILL_OPACITY,
      color: COLOR_WHITE,
      weight: SELECTED_BORDER_WEIGHT,
      interactive: false,
    }).addTo(layer);
    map.setView(center, MAP_SELECTED_ZOOM);
  }, [selectedStop]);

  useEffect(() => {
    const layer = userLayerRef.current;
    const map = mapRef.current;
    if (layer === null || map === null) {
      return;
    }
    layer.clearLayers();
    if (userPosition === null) {
      return;
    }
    L.circleMarker(toLatLng(userPosition), {
      radius: USER_RADIUS,
      fillColor: COLOR_USER,
      fillOpacity: FILL_OPACITY,
      color: COLOR_WHITE,
      weight: STOP_BORDER_WEIGHT,
      interactive: false,
    }).addTo(layer);
    map.setView(toLatLng(userPosition), MAP_DEFAULT_ZOOM);
  }, [userPosition]);

  return <div ref={containerRef} className="absolute inset-0" role="region" aria-label="Mapa de postes" />;
}
