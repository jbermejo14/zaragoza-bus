import type * as Leaflet from 'leaflet';
import { cleanDestination } from '../lib/arrivals-parser';
import type { BusVehicle, VehicleArrival } from '../lib/bus-vehicles';

const ARRIVAL_SEPARATOR = ' / ';
const VEHICLE_ICON_WIDTH_PX = 38;
const VEHICLE_ICON_HEIGHT_PX = 22;

function arrivalText(arrival: VehicleArrival): string {
  return `${arrival.minutes} min (${arrival.km} km)`;
}

/** Texto del tooltip: «Línea 58 → Fuente Junquera · coche 4709 · 21 min (4 km)»; varias llegadas separadas por « / ». */
export function vehicleTooltipText(vehicle: BusVehicle): string {
  const destination = cleanDestination(vehicle.destination);
  const parts = [
    destination === '' ? `Línea ${vehicle.line}` : `Línea ${vehicle.line} → ${destination}`,
    `coche ${vehicle.vehicle}`,
  ];
  if (vehicle.arrivals.length > 0) {
    parts.push(vehicle.arrivals.map(arrivalText).join(ARRIVAL_SEPARATOR));
  }
  return parts.join(' · ');
}

/** Panel propio de los autobuses: por encima de los postes y sus grupos (600) y por debajo de los tooltips (650). */
export const VEHICLE_PANE = 'zb-vehicles';
export const VEHICLE_PANE_Z_INDEX = 640;

/** Nodo de texto plano: Leaflet trata las cadenas de un tooltip como HTML y estos datos vienen de un tercero. */
function textElement(text: string): HTMLSpanElement {
  const element = document.createElement('span');
  element.textContent = text;
  return element;
}

/**
 * Marcador de un autobús: etiqueta con el número de línea (estilos `.zb-bus` en globals.css, que
 * cambian con el tema) y tooltip con sus datos. Recibe Leaflet como parámetro (y no importa
 * bus-map-layers) para que este módulo se pueda probar en Node, donde Leaflet no carga.
 * Todo el texto va como nodos de texto, nunca como HTML.
 */
export function createVehicleMarker(leaflet: typeof Leaflet, vehicle: BusVehicle): Leaflet.Marker {
  const description = vehicleTooltipText(vehicle);
  const label = textElement(vehicle.line);
  label.setAttribute('role', 'img');
  label.setAttribute('aria-label', description);
  const icon = leaflet.divIcon({
    html: label,
    className: 'zb-bus',
    iconSize: leaflet.point(VEHICLE_ICON_WIDTH_PX, VEHICLE_ICON_HEIGHT_PX),
  });
  const marker = leaflet.marker([vehicle.position.latitude, vehicle.position.longitude], {
    icon,
    interactive: true,
    keyboard: false,
    pane: VEHICLE_PANE,
  });
  marker.bindTooltip(textElement(description), { className: 'stop-tooltip' });
  return marker;
}
