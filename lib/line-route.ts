import { lineRouteUrl } from './config';
import { requestJson } from './bus-source';
import type { FetchFunction } from './bus-source';
import { FormatError } from './format-error';
import type { Coordinates } from './types';

const MIN_POINTS_PER_PATH = 2;
const LONGITUDE_INDEX = 0;
const LATITUDE_INDEX = 1;
const LINE_STRING = 'LineString';
const MULTI_LINE_STRING = 'MultiLineString';

/** Error de formato en la respuesta del trazado de una línea. */
export class RouteFormatError extends FormatError {}

/** Trazado de una línea: un tramo por sentido (o los que publique la API). */
export interface LineRoute {
  line: string;
  paths: Coordinates[][];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parsePoint(raw: unknown): Coordinates | null {
  if (!Array.isArray(raw)) return null;
  const longitude = raw[LONGITUDE_INDEX];
  const latitude = raw[LATITUDE_INDEX];
  if (typeof longitude !== 'number' || typeof latitude !== 'number') return null;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return { latitude, longitude };
}

function parsePath(raw: unknown): Coordinates[] | null {
  if (!Array.isArray(raw)) return null;
  const points: Coordinates[] = [];
  for (const rawPoint of raw) {
    const point = parsePoint(rawPoint);
    if (point) points.push(point);
  }
  return points.length >= MIN_POINTS_PER_PATH ? points : null;
}

/** Tramos en bruto de un elemento; los `Point` y otras geometrías no aportan recorrido. */
function rawPathsOf(item: unknown): unknown[] {
  if (!isRecord(item) || !isRecord(item.geometry)) return [];
  const { type, coordinates } = item.geometry;
  if (type === LINE_STRING) return [coordinates];
  if (type === MULTI_LINE_STRING && Array.isArray(coordinates)) return coordinates;
  return [];
}

/**
 * Convierte la respuesta del trazado de una línea en tramos de coordenadas.
 * @throws RouteFormatError si la respuesta no es un objeto, no tiene `result` o no queda ningún tramo.
 */
export function parseLineRoute(line: string, json: unknown): LineRoute {
  if (!isRecord(json)) throw new RouteFormatError('La respuesta del trazado de la línea no es un objeto JSON.');
  if (!Array.isArray(json.result)) {
    throw new RouteFormatError('A la respuesta del trazado de la línea le falta el campo "result" (debe ser una lista).');
  }
  const paths: Coordinates[][] = [];
  for (const item of json.result) {
    for (const rawPath of rawPathsOf(item)) {
      const path = parsePath(rawPath);
      if (path) paths.push(path);
    }
  }
  if (paths.length === 0) throw new RouteFormatError(`La API no publica ningún trazado para la línea ${line}.`);
  return { line, paths };
}

/**
 * Descarga y analiza el trazado oficial de una línea.
 * Lanza ante cualquier fallo; `describeFailure` da el mensaje para el usuario.
 */
export async function fetchLineRoute(line: string, fetchFn: FetchFunction): Promise<LineRoute> {
  return parseLineRoute(line, await requestJson(fetchFn, lineRouteUrl(line)));
}
