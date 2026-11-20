import { vehiclesProxyUrl } from './config';
import { requestJson } from './bus-source';
import type { FetchFunction } from './bus-source';
import { FormatError } from './format-error';
import type { Coordinates } from './types';

/** Llegada prevista de un autobús al poste. */
export interface VehicleArrival {
  minutes: number;
  km: number;
}

/** Autobús (un coche en una línea y destino) con su posición GPS y sus llegadas al poste. */
export interface BusVehicle {
  vehicle: string;
  line: string;
  destination: string;
  position: Coordinates;
  arrivals: VehicleArrival[];
}

/** Autobuses que se acercan a un poste y, si viene, la posición del propio poste. */
export interface StopVehicles {
  stopPosition: Coordinates | null;
  vehicles: BusVehicle[];
}

/** Error de formato en la respuesta de posiciones de autobuses. */
export class VehiclesFormatError extends FormatError {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseCoordinates(raw: unknown, where: string): Coordinates {
  if (!isRecord(raw) || !isFiniteNumber(raw.latitud) || !isFiniteNumber(raw.longitud)) {
    throw new VehiclesFormatError(`${where} no tiene "latitud" y "longitud" numéricas finitas.`);
  }
  return { latitude: raw.latitud, longitude: raw.longitud };
}

function parseStopPosition(raw: unknown): Coordinates | null {
  if (raw === null || raw === undefined) return null;
  return parseCoordinates(raw, 'El campo "poste"');
}

function parseArrival(raw: unknown, where: string): VehicleArrival {
  if (!isRecord(raw) || !isFiniteNumber(raw.minutos) || !isFiniteNumber(raw.km)) {
    throw new VehiclesFormatError(`${where} tiene una llegada sin "minutos" y "km" numéricos finitos.`);
  }
  return { minutes: raw.minutos, km: raw.km };
}

function requireText(raw: Record<string, unknown>, field: string, where: string): string {
  const value = raw[field];
  if (typeof value !== 'string' || value === '') {
    throw new VehiclesFormatError(`${where} no tiene el campo de texto "${field}".`);
  }
  return value;
}

/** El destino puede faltar o venir vacío; si existe, debe ser texto. */
function parseDestination(value: unknown, where: string): string {
  if (value === undefined) return '';
  if (typeof value !== 'string') {
    throw new VehiclesFormatError(`${where} tiene un campo "destino" que no es texto.`);
  }
  return value;
}

function parseVehicle(raw: unknown, index: number): BusVehicle {
  const where = `El autobús ${index}`;
  if (!isRecord(raw)) throw new VehiclesFormatError(`${where} no es un objeto.`);
  if (!Array.isArray(raw.llegadas)) {
    throw new VehiclesFormatError(`${where} no tiene "llegadas" (debe ser una lista).`);
  }
  return {
    vehicle: requireText(raw, 'coche', where),
    line: requireText(raw, 'linea', where),
    // El destino puede venir vacío; solo debe ser texto.
    destination: parseDestination(raw.destino, where),
    position: parseCoordinates(raw, where),
    arrivals: raw.llegadas.map((arrival) => parseArrival(arrival, where)),
  };
}

/**
 * Convierte la respuesta del Worker en autobuses y posición del poste.
 * @throws VehiclesFormatError si no es un objeto, `autobuses` no es una lista o un autobús es inválido.
 */
export function parseStopVehicles(json: unknown): StopVehicles {
  if (!isRecord(json)) throw new VehiclesFormatError('La respuesta de autobuses no es un objeto JSON.');
  if (!Array.isArray(json.autobuses)) {
    throw new VehiclesFormatError('A la respuesta de autobuses le falta el campo "autobuses" (debe ser una lista).');
  }
  return {
    stopPosition: parseStopPosition(json.poste),
    vehicles: json.autobuses.map(parseVehicle),
  };
}

/**
 * Descarga y analiza los autobuses que se acercan a un poste.
 * Lanza ante cualquier fallo, sin datos demo: si falla, el mapa no dibuja autobuses.
 */
export async function fetchStopVehicles(stopNumber: string, fetchFn: FetchFunction): Promise<StopVehicles> {
  return parseStopVehicles(await requestJson(fetchFn, vehiclesProxyUrl(stopNumber)));
}
