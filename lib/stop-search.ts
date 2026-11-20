import { SEARCH_RESULT_LIMIT } from './config';
import { normalizeText } from './text';
import type { BusStop } from './types';

const DIGITS_ONLY = /^\d+$/;
const CIRCULAR_LINE = /^ci/i;
const C_LINE = /^c/i;
const NIGHT_LINE = /^n/i;
const SPANISH_LOCALE = 'es';
const naturalCollator = new Intl.Collator(SPANISH_LOCALE, { numeric: true });
const nameCollator = new Intl.Collator(SPANISH_LOCALE);

const LINE_GROUP_NUMERIC = 0;
const LINE_GROUP_CIRCULAR = 1;
const LINE_GROUP_C = 2;
const LINE_GROUP_NIGHT = 3;
const LINE_GROUP_OTHER = 4;

function stopSearchLineGroup(line: string): number {
  if (DIGITS_ONLY.test(line)) {
    return LINE_GROUP_NUMERIC;
  }
  if (CIRCULAR_LINE.test(line)) {
    return LINE_GROUP_CIRCULAR;
  }
  if (C_LINE.test(line)) {
    return LINE_GROUP_C;
  }
  if (NIGHT_LINE.test(line)) {
    return LINE_GROUP_NIGHT;
  }
  return LINE_GROUP_OTHER;
}

/**
 * Compara dos líneas: primero las numéricas, luego `Ci…`, `C…`, `N…` y el resto;
 * dentro de cada grupo, orden natural.
 */
export function compareLines(a: string, b: string): number {
  const groupDifference = stopSearchLineGroup(a) - stopSearchLineGroup(b);
  if (groupDifference !== 0) {
    return groupDifference;
  }
  return naturalCollator.compare(a, b);
}

const CHIP_GROUP_ORDER = [
  LINE_GROUP_CIRCULAR,
  LINE_GROUP_NUMERIC,
  LINE_GROUP_C,
  LINE_GROUP_NIGHT,
  LINE_GROUP_OTHER,
];

/**
 * Compara líneas para la fila de chips: primero `Ci…`, luego numéricas, `C…`, `N…` y el resto;
 * dentro de cada grupo, orden natural.
 */
export function compareChipLines(a: string, b: string): number {
  const groupDifference =
    CHIP_GROUP_ORDER.indexOf(stopSearchLineGroup(a)) - CHIP_GROUP_ORDER.indexOf(stopSearchLineGroup(b));
  if (groupDifference !== 0) {
    return groupDifference;
  }
  return naturalCollator.compare(a, b);
}

/** Líneas distintas de todos los postes, ordenadas con `compareLines`. */
export function listLines(stops: readonly BusStop[]): string[] {
  const lines = new Set<string>();
  for (const stop of stops) {
    for (const line of stop.lines) {
      lines.add(line);
    }
  }
  return [...lines].sort(compareLines);
}

const LINE_QUERY_PREFIX = /^(l[ií]nea|l\.)\s*/;
const WHITESPACE = /\s+/g;
const LINE_SEARCH_LIMIT = 8;

function stopSearchNormalizeLineQuery(query: string): string {
  return query.trim().toLowerCase().replace(LINE_QUERY_PREFIX, '').replace(WHITESPACE, '');
}

/**
 * Busca líneas por nombre: ignora mayúsculas, espacios y un prefijo «línea»/«linea»/«l.».
 * Primero la coincidencia exacta y después las que empiezan por la consulta, en orden de `compareLines`.
 */
export function searchLines(
  lines: readonly string[],
  query: string,
  limit: number = LINE_SEARCH_LIMIT,
): string[] {
  const normalizedQuery = stopSearchNormalizeLineQuery(query);
  if (normalizedQuery === '') {
    return [];
  }
  const matches = lines
    .filter((line) => line.toLowerCase().startsWith(normalizedQuery))
    .sort(compareLines);
  const exact = matches.filter((line) => line.toLowerCase() === normalizedQuery);
  const rest = matches.filter((line) => line.toLowerCase() !== normalizedQuery);
  return [...exact, ...rest].slice(0, limit);
}

/** Busca un poste por su número exacto; `null` si no existe. */
export function findStopByNumber(stops: readonly BusStop[], number: string): BusStop | null {
  return stops.find((stop) => stop.number === number) ?? null;
}

function stopSearchCompareNumbers(a: BusStop, b: BusStop): number {
  return naturalCollator.compare(a.number, b.number);
}

function stopSearchHasLine(stop: BusStop, lowerCaseLine: string): boolean {
  return stop.lines.some((candidate) => candidate.toLowerCase() === lowerCaseLine);
}

function stopSearchByNumberPrefix(stops: readonly BusStop[], digits: string): BusStop[] {
  return stops
    .filter((stop) => stop.number.startsWith(digits))
    .sort((a, b) => {
      const exactA = a.number === digits ? 0 : 1;
      const exactB = b.number === digits ? 0 : 1;
      return exactA - exactB || a.number.length - b.number.length || stopSearchCompareNumbers(a, b);
    });
}

interface StopSearchCandidate {
  stop: BusStop;
  startsWord: boolean;
}

function stopSearchStartsWord(normalizedName: string, tokens: readonly string[]): boolean {
  const words = normalizedName.split(' ');
  return words.some((word) => tokens.some((token) => word.startsWith(token)));
}

function stopSearchByName(stops: readonly BusStop[], tokens: readonly string[]): BusStop[] {
  const candidates: StopSearchCandidate[] = [];
  for (const stop of stops) {
    const normalizedName = normalizeText(stop.name);
    if (tokens.every((token) => normalizedName.includes(token))) {
      candidates.push({ stop, startsWord: stopSearchStartsWord(normalizedName, tokens) });
    }
  }
  return candidates
    .sort((a, b) => {
      const startA = a.startsWord ? 0 : 1;
      const startB = b.startsWord ? 0 : 1;
      return (
        startA - startB ||
        nameCollator.compare(a.stop.name, b.stop.name) ||
        stopSearchCompareNumbers(a.stop, b.stop)
      );
    })
    .map((candidate) => candidate.stop);
}

/**
 * Busca postes por número (solo dígitos) o por nombre, con filtro opcional de línea.
 * Sin consulta y sin línea devuelve `[]`; sin consulta y con línea, todos los de la línea.
 */
export function searchStops(
  stops: readonly BusStop[],
  query: string,
  line: string | null,
  limit: number = SEARCH_RESULT_LIMIT,
): BusStop[] {
  const trimmedQuery = query.trim();
  const tokens = normalizeText(trimmedQuery).split(' ').filter((token) => token !== '');
  if (tokens.length === 0 && line === null) {
    return [];
  }
  const lowerCaseLine = line === null ? null : line.toLowerCase();
  const candidates =
    lowerCaseLine === null ? stops : stops.filter((stop) => stopSearchHasLine(stop, lowerCaseLine));
  let results: BusStop[];
  if (tokens.length === 0) {
    results = [...candidates].sort(stopSearchCompareNumbers);
  } else if (DIGITS_ONLY.test(trimmedQuery)) {
    results = stopSearchByNumberPrefix(candidates, trimmedQuery);
  } else {
    results = stopSearchByName(candidates, tokens);
  }
  return results.slice(0, limit);
}
