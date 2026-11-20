import type { BusVehicle } from './bus-vehicles';
import type { Arrival, BusStop } from './types';

const NUMERIC_LINE = /^\d+$/;
const LEADING_ZEROS = /^0+(?=\d)/;

function normalizeLine(line: string): string {
  const trimmed = line.trim().toLowerCase();
  return NUMERIC_LINE.test(trimmed) ? trimmed.replace(LEADING_ZEROS, '') : trimmed;
}

/**
 * Indica si dos nombres de línea son la misma: sin distinguir mayúsculas («Ci2» = «CI2») y, en las
 * numéricas, sin ceros a la izquierda («058» = «58»), igual que el Worker.
 */
export function sameLine(first: string, second: string): boolean {
  return normalizeLine(first) === normalizeLine(second);
}

/**
 * Postes que muestra el mapa con un filtro de línea: solo los que la incluyen. Sin filtro (`null`) devuelve
 * todos. La comparación es la de `sameLine`.
 */
export function stopsForLine(stops: readonly BusStop[], line: string | null): readonly BusStop[] {
  if (line === null) {
    return stops;
  }
  return stops.filter((stop) => stop.lines.some((candidate) => sameLine(candidate, line)));
}

/** Llegadas de la marquesina con un filtro de línea: solo las de esa línea. Sin filtro devuelve todas. */
export function arrivalsForLine(arrivals: readonly Arrival[], line: string | null): readonly Arrival[] {
  if (line === null) {
    return arrivals;
  }
  return arrivals.filter((arrival) => sameLine(arrival.line, line));
}

/** Autobuses que dibuja el mapa con un filtro de línea: solo los de esa línea. Sin filtro devuelve todos. */
export function visibleVehicles(vehicles: readonly BusVehicle[], line: string | null): readonly BusVehicle[] {
  if (line === null) {
    return vehicles;
  }
  return vehicles.filter((vehicle) => sameLine(vehicle.line, line));
}
