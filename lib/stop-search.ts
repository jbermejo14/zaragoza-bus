import { SEARCH_RESULT_LIMIT } from './config';
import { normalizeText } from './text';
import type { BusStop } from './types';

const DIGITS_ONLY = /^\d+$/;
const CIRCULAR_LINE = /^ci/i;
const C_LINE = /^c/i;
const NIGHT_LINE = /^n/i;
const NATURAL_ORDER = { numeric: true } as const;
const SPANISH_LOCALE = 'es';

const LINE_GROUP_NUMERIC = 0;
const LINE_GROUP_CIRCULAR = 1;
const LINE_GROUP_C = 2;
const LINE_GROUP_NIGHT = 3;
const LINE_GROUP_OTHER = 4;

function stopSearchLineGroup(line: string): number {
  if (DIGITS_ONLY.test(line)) return LINE_GROUP_NUMERIC;
  if (CIRCULAR_LINE.test(line)) return LINE_GROUP_CIRCULAR;
  if (C_LINE.test(line)) return LINE_GROUP_C;
  if (NIGHT_LINE.test(line)) return LINE_GROUP_NIGHT;
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
  return a.localeCompare(b, SPANISH_LOCALE, NATURAL_ORDER);
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

/** Busca un poste por su número exacto; `null` si no existe. */
export function findStopByNumber(stops: readonly BusStop[], number: string): BusStop | null {
  return stops.find((stop) => stop.number === number) ?? null;
}

function stopSearchCompareNumbers(a: BusStop, b: BusStop): number {
  return a.number.localeCompare(b.number, SPANISH_LOCALE, NATURAL_ORDER);
}

function stopSearchHasLine(stop: BusStop, line: string): boolean {
  const wanted = line.toLowerCase();
  return stop.lines.some((candidate) => candidate.toLowerCase() === wanted);
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
  normalizedName: string;
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
      candidates.push({ stop, normalizedName, startsWord: stopSearchStartsWord(normalizedName, tokens) });
    }
  }
  return candidates
    .sort((a, b) => {
      const startA = a.startsWord ? 0 : 1;
      const startB = b.startsWord ? 0 : 1;
      return (
        startA - startB ||
        a.stop.name.localeCompare(b.stop.name, SPANISH_LOCALE) ||
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
  if (trimmedQuery === '' && line === null) {
    return [];
  }
  const candidates = line === null ? stops : stops.filter((stop) => stopSearchHasLine(stop, line));
  const tokens = normalizeText(trimmedQuery).split(' ').filter((token) => token !== '');
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
