import type * as Leaflet from 'leaflet';
import { cleanDestination } from '../lib/arrivals-parser';
import type { BusVehicle, VehicleArrival } from '../lib/bus-vehicles';

const ARRIVAL_SEPARATOR = ' / ';
/** Diámetro del círculo del icono, borde incluido (el CSS usa borde de 3 px con `box-sizing: border-box`). */
const VEHICLE_ICON_SIZE_PX = 34;

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const BUS_GLYPH_SIZE_PX = 20;
const BUS_GLYPH_VIEW_BOX = '0 0 24 24';
const BUS_GLYPH_STROKE_WIDTH = '2.2';
/** Silueta de autobús (icono «Bus» de lucide, licencia ISC) dibujada con trazos del color del texto (blanco). */
const BUS_GLYPH_PATHS = [
  'M8 6v6',
  'M15 6v6',
  'M2 12h19.6',
  'M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3',
  'M9 18h5',
];
const BUS_GLYPH_WHEELS = [7, 16];
const BUS_GLYPH_WHEEL_Y = '18';
const BUS_GLYPH_WHEEL_RADIUS = '2';

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

/** Icono de autobús como SVG propio (sin HTML de terceros), decorativo: el texto accesible va en la etiqueta. */
function busGlyph(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', BUS_GLYPH_VIEW_BOX);
  svg.setAttribute('width', String(BUS_GLYPH_SIZE_PX));
  svg.setAttribute('height', String(BUS_GLYPH_SIZE_PX));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', BUS_GLYPH_STROKE_WIDTH);
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  BUS_GLYPH_PATHS.forEach((definition) => {
    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    path.setAttribute('d', definition);
    svg.appendChild(path);
  });
  BUS_GLYPH_WHEELS.forEach((centerX) => {
    const wheel = document.createElementNS(SVG_NAMESPACE, 'circle');
    wheel.setAttribute('cx', String(centerX));
    wheel.setAttribute('cy', BUS_GLYPH_WHEEL_Y);
    wheel.setAttribute('r', BUS_GLYPH_WHEEL_RADIUS);
    svg.appendChild(wheel);
  });
  return svg;
}

/** Insignia: solo el icono de autobús; es el elemento con  y la descripción completa. */
function vehicleBadge(description: string): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = 'zb-bus-badge';
  badge.setAttribute('role', 'img');
  badge.setAttribute('aria-label', description);
  badge.append(busGlyph());
  return badge;
}

/**
 * Marcador de un autobús: círculo con el icono de autobús (estilos `.zb-bus` en globals.css, que
 * cambian con el tema) y tooltip con sus datos. Recibe Leaflet como parámetro (y no importa
 * bus-map-layers) para que este módulo se pueda probar en Node, donde Leaflet no carga.
 * Todo el texto va como nodos de texto, nunca como HTML.
 */
export function createVehicleMarker(leaflet: typeof Leaflet, vehicle: BusVehicle): Leaflet.Marker {
  const description = vehicleTooltipText(vehicle);
  const icon = leaflet.divIcon({
    html: vehicleBadge(description),
    className: 'zb-bus',
    iconSize: leaflet.point(VEHICLE_ICON_SIZE_PX, VEHICLE_ICON_SIZE_PX),
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
