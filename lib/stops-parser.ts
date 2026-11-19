import { FormatError } from './format-error';
import { URBAN_STOP_ID_PREFIX } from './config';
import type { BusStop, Coordinates } from './types';

/** Error de formato en la respuesta del listado de postes. */
export class StopsFormatError extends FormatError {}

export interface StopListPage {
  stops: BusStop[];
  totalCount: number;
  /** Número de elementos que traía `result`, antes de descartar ninguno. */
  rawCount: number;
}

const STOP_TITLE_PATTERN = /^\((\w+)\)\s*(.*?)\s*Líneas:\s*(.*)$/;
const LINE_SEPARATOR = ',';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Separa un título «(número) nombre Líneas: l1, l2» en sus partes; `null` si no casa. */
export function parseStopTitle(title: string): { number: string; name: string; lines: string[] } | null {
  const match = STOP_TITLE_PATTERN.exec(title);
  if (match === null) {
    return null;
  }
  const lines = match[3]
    .split(LINE_SEPARATOR)
    .map((line) => line.trim())
    .filter((line) => line !== '');
  return { number: match[1], name: match[2], lines };
}

function parseCoordinates(geometry: unknown): Coordinates | null {
  if (!isRecord(geometry) || !Array.isArray(geometry.coordinates)) {
    return null;
  }
  const [longitude, latitude] = geometry.coordinates;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }
  return { latitude: latitude as number, longitude: longitude as number };
}

function parseStopItem(item: unknown): BusStop | null {
  if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string') {
    return null;
  }
  if (!item.id.startsWith(URBAN_STOP_ID_PREFIX)) {
    return null;
  }
  const title = parseStopTitle(item.title);
  const coordinates = parseCoordinates(item.geometry);
  if (title === null || coordinates === null) {
    return null;
  }
  return { id: item.id, number: title.number, name: title.name, lines: title.lines, coordinates };
}

/**
 * Convierte una página del listado de la API en postes urbanos válidos.
 * Descarta sin lanzar los elementos rotos, rurales o con `id` repetido.
 * @throws StopsFormatError si la respuesta no tiene la forma esperada.
 */
export function parseStopListPage(json: unknown): StopListPage {
  if (!isRecord(json)) {
    throw new StopsFormatError('La respuesta del listado de postes no es un objeto JSON.');
  }
  if (!Array.isArray(json.result)) {
    throw new StopsFormatError('A la respuesta del listado de postes le falta el campo "result" (debe ser una lista).');
  }
  const seenIds = new Set<string>();
  const stops: BusStop[] = [];
  for (const item of json.result) {
    const stop = parseStopItem(item);
    if (stop !== null && !seenIds.has(stop.id)) {
      seenIds.add(stop.id);
      stops.push(stop);
    }
  }
  const rawCount = json.result.length;
  const totalCount = Number.isFinite(json.totalCount) ? (json.totalCount as number) : rawCount;
  return { stops, totalCount, rawCount };
}
