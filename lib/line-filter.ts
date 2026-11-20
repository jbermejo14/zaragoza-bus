import type { Arrival, BusStop } from './types';

function lineFilterMatches(candidate: string, line: string): boolean {
  return candidate.toLowerCase() === line.toLowerCase();
}

/**
 * Postes que muestra el mapa con un filtro de línea: solo los que la incluyen. Sin filtro (`null`) devuelve
 * todos. La comparación no distingue mayúsculas, igual que `searchStops`.
 */
export function stopsForLine(stops: readonly BusStop[], line: string | null): readonly BusStop[] {
  if (line === null) {
    return stops;
  }
  return stops.filter((stop) => stop.lines.some((candidate) => lineFilterMatches(candidate, line)));
}

/** Llegadas de la marquesina con un filtro de línea: solo las de esa línea. Sin filtro devuelve todas. */
export function arrivalsForLine(arrivals: readonly Arrival[], line: string | null): readonly Arrival[] {
  if (line === null) {
    return arrivals;
  }
  return arrivals.filter((arrival) => lineFilterMatches(arrival.line, line));
}
