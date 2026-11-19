import snapshot from '../data/stops-snapshot.json';
import type { Arrival, BusStop } from './types';
import { parseStopListPage } from './stops-parser';

/** Duración de la ventana en la que los minutos simulados no cambian. */
const DEMO_WINDOW_MS = 30_000;
const DEMO_MAX_FIRST_MINUTES = 15;
const DEMO_MIN_GAP_MINUTES = 6;
const DEMO_MAX_GAP_MINUTES = 18;
/** Una de cada N llegadas simuladas no tiene segunda estimación. */
const DEMO_NO_SECOND_ESTIMATE_ONE_IN = 12;
const DEMO_FNV_OFFSET_BASIS = 2166136261;
const DEMO_FNV_PRIME = 16777619;
const DEMO_FALLBACK_TERMINUS = 'Plaza España';

const DEMO_FIRST_SALT = 'primero';
const DEMO_GAP_SALT = 'hueco';
const DEMO_MISSING_SECOND_SALT = 'sin-segundo';
const DEMO_DIRECTION_SALT = 'direccion';

/**
 * Cabeceras de cada línea (par de sentidos). Es una tabla ILUSTRATIVA para el modo demo:
 * usa barrios reales de Zaragoza, pero no refleja los recorridos oficiales de las líneas.
 */
const DEMO_DESTINATIONS: Readonly<Record<string, readonly [string, string]>> = {
  '21': ['Universidad', 'Plaza Aragón'],
  '22': ['Parque Goya', 'Plaza España'],
  '23': ['Valdespartera', 'Plaza Aragón'],
  '24': ['Las Fuentes', 'Hospital Miguel Servet'],
  '25': ['Vadorrey', 'Plaza España'],
  '28': ['Oliver', 'Estación Delicias'],
  '29': ['Miralbueno', 'Plaza España'],
  '30': ['Casablanca', 'Plaza Aragón'],
  '31': ['Torrero', 'Plaza España'],
  '32': ['Santa Isabel', 'Plaza Aragón'],
  '33': ['Arcosur', 'Plaza España'],
  '34': ['La Jota', 'Plaza España'],
  '35': ['Parque Goya', 'Plaza Aragón'],
  '36': ['Actur', 'Plaza España'],
  '38': ['Delicias', 'Plaza Aragón'],
  '39': ['San José', 'Plaza España'],
  '40': ['Rosales del Canal', 'Plaza España'],
  '41': ['Valdespartera', 'Plaza España'],
  '42': ['Arcosur', 'Estación Delicias'],
  '50': ['Hospital Miguel Servet', 'Plaza España'],
  '51': ['Universidad', 'Estación Delicias'],
  '52': ['Casablanca', 'Plaza España'],
  '53': ['Santa Isabel', 'Plaza España'],
  '54': ['Vadorrey', 'Plaza Aragón'],
  '55': ['Oliver', 'Plaza España'],
  '56': ['Rosales del Canal', 'Plaza Aragón'],
  '57': ['Actur', 'Estación Delicias'],
  '58': ['Parque Goya', 'Estación Delicias'],
  '59': ['Torrero', 'Plaza Aragón'],
  '60': ['La Jota', 'Plaza Aragón'],
  Ci1: ['Plaza España', 'Plaza España'],
  Ci2: ['Plaza Aragón', 'Plaza Aragón'],
  Ci3: ['Delicias', 'Actur'],
  Ci4: ['Torrero', 'San José'],
  N1: ['Arcosur', 'Plaza España'],
  N2: ['Valdespartera', 'Plaza España'],
  N3: ['Santa Isabel', 'Plaza España'],
  N4: ['Las Fuentes', 'Plaza España'],
  N5: ['Actur', 'Plaza España'],
  N6: ['Miralbueno', 'Plaza España'],
  N7: ['Casablanca', 'Plaza España'],
};

/** Listado de postes demo: la captura real de `data/stops-snapshot.json`. */
export function demoStops(): BusStop[] {
  return parseStopListPage(snapshot).stops;
}

/** Hash FNV-1a de 32 bits: estable entre ejecuciones y plataformas. */
function demoHash(text: string): number {
  let hash = DEMO_FNV_OFFSET_BASIS;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, DEMO_FNV_PRIME) >>> 0;
  }
  return hash;
}

function demoRandomInt(seed: string, salt: string, minimum: number, maximum: number): number {
  return minimum + (demoHash(`${seed}|${salt}`) % (maximum - minimum + 1));
}

function demoTerminus(line: string, stopId: string): string {
  const pair = DEMO_DESTINATIONS[line] ?? [DEMO_FALLBACK_TERMINUS, `${line} Cabecera`];
  return pair[demoHash(`${stopId}|${line}|${DEMO_DIRECTION_SALT}`) % pair.length];
}

function demoArrival(stop: BusStop, line: string, window: number): Arrival {
  const seed = `${stop.id}|${line}|${window}`;
  const firstMinutes = demoRandomInt(seed, DEMO_FIRST_SALT, 0, DEMO_MAX_FIRST_MINUTES);
  const gap = demoRandomInt(seed, DEMO_GAP_SALT, DEMO_MIN_GAP_MINUTES, DEMO_MAX_GAP_MINUTES);
  const hasSecond = demoHash(`${seed}|${DEMO_MISSING_SECOND_SALT}`) % DEMO_NO_SECOND_ESTIMATE_ONE_IN !== 0;
  return {
    line,
    destination: demoTerminus(line, stop.id),
    firstMinutes,
    secondMinutes: hasSecond ? firstMinutes + gap : null,
  };
}

function compareDemoArrivals(a: Arrival, b: Arrival): number {
  const firstDifference = (a.firstMinutes ?? Infinity) - (b.firstMinutes ?? Infinity);
  if (firstDifference !== 0) return firstDifference;
  return a.line.localeCompare(b.line, 'es', { numeric: true });
}

/**
 * Llegadas simuladas y deterministas de un poste: para el mismo poste y la misma ventana de
 * 30 s devuelve siempre lo mismo. Un poste sin líneas devuelve una lista vacía.
 */
export function demoArrivals(stop: BusStop, now: Date): Arrival[] {
  const window = Math.floor(now.getTime() / DEMO_WINDOW_MS);
  return stop.lines.map((line) => demoArrival(stop, line, window)).sort(compareDemoArrivals);
}
