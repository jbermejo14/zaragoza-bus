import { FormatError } from './format-error';
import type { Arrival } from './types';

/** Error de formato en la respuesta de tiempos de paso. */
export class ArrivalsFormatError extends FormatError {}

const HTTP_ERROR_STATUS_MIN = 400;
const ARRIVING_PATTERN = /parada|llegando|inminente/;
const INTEGER_PATTERN = /\d+/;
const LOWERCASE_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y']);
const TRAILING_PUNCTUATION_PATTERN = /[.,]+$/;
const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;
const KEPT_MINUTES_COUNT = 2;

interface ArrivalGroup {
  line: string;
  destination: string;
  minutes: number[];
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS_PATTERN, '');
}

/** Convierte el texto de minutos de la API en minutos (0 = llegando) o null si no hay estimación. */
export function parseMinutes(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = stripAccents(value).toLowerCase();
  if (ARRIVING_PATTERN.test(text)) {
    return 0;
  }
  const match = INTEGER_PATTERN.exec(text);
  return match ? Number(match[0]) : null;
}

function capitalizeWord(word: string, index: number): string {
  const lower = word.toLowerCase();
  if (index > 0 && LOWERCASE_WORDS.has(lower)) {
    return lower;
  }
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Limpia el destino de la API ("PARQUE GOYA.") y lo pasa a tipo título ("Parque Goya"). */
export function cleanDestination(value: string): string {
  const trimmed = value.trim().replace(TRAILING_PUNCTUATION_PATTERN, '').trim();
  return trimmed
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map(capitalizeWord)
    .join(' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readDestinations(json: unknown): unknown[] {
  if (!isRecord(json)) {
    throw new ArrivalsFormatError('La respuesta de tiempos de paso no es un objeto.');
  }
  if (typeof json.status === 'number' && json.status >= HTTP_ERROR_STATUS_MIN) {
    const message = typeof json.mensaje === 'string' ? json.mensaje : 'sin mensaje';
    throw new ArrivalsFormatError(`La API devolvió el estado ${json.status}: ${message}`);
  }
  if (!Array.isArray(json.destinos)) {
    throw new ArrivalsFormatError('Falta el campo "destinos" (debe ser una lista) en la respuesta.');
  }
  return json.destinos;
}

function addToGroups(groups: Map<string, ArrivalGroup>, item: unknown): void {
  if (!isRecord(item) || typeof item.linea !== 'string' || item.linea.trim() === '') {
    return;
  }
  const line = item.linea.trim();
  const destination = cleanDestination(typeof item.destino === 'string' ? item.destino : '');
  const key = `${line}\u0000${destination}`;
  const group = groups.get(key) ?? { line, destination, minutes: [] };
  for (const raw of [item.primero, item.segundo]) {
    const minutes = parseMinutes(raw);
    if (minutes !== null) {
      group.minutes.push(minutes);
    }
  }
  groups.set(key, group);
}

function groupToArrival(group: ArrivalGroup): Arrival {
  const [first = null, second = null] = [...group.minutes]
    .sort((a, b) => a - b)
    .slice(0, KEPT_MINUTES_COUNT);
  return { line: group.line, destination: group.destination, firstMinutes: first, secondMinutes: second };
}

function compareArrivals(a: Arrival, b: Arrival): number {
  if (a.firstMinutes !== b.firstMinutes) {
    if (a.firstMinutes === null) {
      return 1;
    }
    if (b.firstMinutes === null) {
      return -1;
    }
    return a.firstMinutes - b.firstMinutes;
  }
  return a.line.localeCompare(b.line, 'es', { numeric: true });
}

/** Convierte la respuesta de tiempos de paso en llegadas ordenadas. Lanza ArrivalsFormatError si el formato no es válido. */
export function parseArrivals(json: unknown): Arrival[] {
  const destinations = readDestinations(json);
  const groups = new Map<string, ArrivalGroup>();
  for (const item of destinations) {
    addToGroups(groups, item);
  }
  return [...groups.values()].map(groupToArrival).sort(compareArrivals);
}
