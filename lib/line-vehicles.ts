import { requestJson } from './bus-source';
import type { FetchFunction } from './bus-source';
import type { BusVehicle } from './bus-vehicles';
import { LINE_VEHICLES_TIMEOUT_MS, lineVehiclesProxyUrl } from './config';
import { FormatError } from './format-error';
import { distanceMeters } from './geo';
import type { BusStop } from './types';

/** Error de formato en la respuesta de autobuses de una línea. */
export class LineVehiclesFormatError extends FormatError {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function requireText(raw: Record<string, unknown>, field: string, where: string): string {
  const value = raw[field];
  if (typeof value !== 'string' || value === '') {
    throw new LineVehiclesFormatError(`${where} no tiene el campo de texto "${field}".`);
  }
  return value;
}

function parseLineVehicle(raw: unknown, index: number): BusVehicle {
  const where = `El autobús ${index}`;
  if (!isRecord(raw)) {
    throw new LineVehiclesFormatError(`${where} no es un objeto.`);
  }
  if (!isFiniteNumber(raw.latitud) || !isFiniteNumber(raw.longitud)) {
    throw new LineVehiclesFormatError(`${where} no tiene "latitud" y "longitud" numéricas finitas.`);
  }
  if (raw.destino !== undefined && typeof raw.destino !== 'string') {
    throw new LineVehiclesFormatError(`${where} tiene un campo "destino" que no es texto.`);
  }
  return {
    vehicle: requireText(raw, 'coche', where),
    line: requireText(raw, 'linea', where),
    destination: raw.destino ?? '',
    position: { latitude: raw.latitud, longitude: raw.longitud },
    arrivals: [],
  };
}

/**
 * Convierte la respuesta del Worker en los autobuses de la línea (sin llegadas: dependen de la parada).
 * @throws LineVehiclesFormatError si no es un objeto, `autobuses` no es una lista o un autobús es inválido.
 */
export function parseLineVehicles(json: unknown): BusVehicle[] {
  if (!isRecord(json)) {
    throw new LineVehiclesFormatError('La respuesta de autobuses de la línea no es un objeto JSON.');
  }
  if (!Array.isArray(json.autobuses)) {
    throw new LineVehiclesFormatError('A la respuesta le falta el campo "autobuses" (debe ser una lista).');
  }
  return json.autobuses.map(parseLineVehicle);
}

/**
 * Descarga todos los autobuses de una línea consultando los postes dados.
 * Lanza ante cualquier fallo, sin datos demo: si falla, el mapa no dibuja autobuses.
 */
export async function fetchLineVehicles(
  line: string,
  stopNumbers: readonly string[],
  fetchFn: FetchFunction,
): Promise<BusVehicle[]> {
  return parseLineVehicles(await requestJson(fetchFn, lineVehiclesProxyUrl(line, stopNumbers), LINE_VEHICLES_TIMEOUT_MS));
}

function westernmostIndex(stops: readonly BusStop[]): number {
  let best = 0;
  stops.forEach((stop, index) => {
    if (stop.coordinates.longitude < stops[best].coordinates.longitude) {
      best = index;
    }
  });
  return best;
}

/** Índice del mayor valor de `values` (el primero si hay empate). */
function indexOfMaximum(values: readonly number[]): number {
  let best = 0;
  values.forEach((value, index) => {
    if (value > values[best]) {
      best = index;
    }
  });
  return best;
}

/**
 * Elige hasta `count` postes repartidos por la línea: muestreo del punto más lejano, empezando por el
 * más al oeste. Determinista (los empates los gana el primero de la lista). Con `count` mayor o igual
 * que los postes disponibles devuelve todos, en el orden recibido.
 */
export function pickSampleStops(stops: readonly BusStop[], count: number): BusStop[] {
  if (count <= 0 || stops.length === 0) {
    return [];
  }
  if (count >= stops.length) {
    return [...stops];
  }
  const first = stops[westernmostIndex(stops)];
  const picked = [first];
  // Distancia de cada poste al muestreado más próximo; los ya elegidos quedan en 0 y no se repiten.
  const minDistances = stops.map((stop) => distanceMeters(stop.coordinates, first.coordinates));
  while (picked.length < count) {
    const nextIndex = indexOfMaximum(minDistances);
    if (minDistances[nextIndex] === 0) {
      break; // Los postes que quedan están en la misma posición que alguno ya elegido.
    }
    const next = stops[nextIndex];
    picked.push(next);
    stops.forEach((stop, index) => {
      minDistances[index] = Math.min(minDistances[index], distanceMeters(stop.coordinates, next.coordinates));
    });
  }
  return picked;
}

/**
 * Une dos listas de autobuses por coche: los de `incoming` sustituyen a los de `previous` con el mismo
 * coche (posición y datos nuevos) y los coches nuevos se añaden al final. Conserva el orden de `previous`.
 */
export function mergeVehicles(previous: readonly BusVehicle[], incoming: readonly BusVehicle[]): BusVehicle[] {
  const byVehicle = new Map<string, BusVehicle>();
  previous.forEach((vehicle) => byVehicle.set(vehicle.vehicle, vehicle));
  incoming.forEach((vehicle) => byVehicle.set(vehicle.vehicle, vehicle));
  return [...byVehicle.values()];
}

/** Deja solo los autobuses cuyo coche está en `seenVehicles` (los vistos en un refresco completo). */
export function retainSeenVehicles(vehicles: readonly BusVehicle[], seenVehicles: ReadonlySet<string>): BusVehicle[] {
  return vehicles.filter((vehicle) => seenVehicles.has(vehicle.vehicle));
}
