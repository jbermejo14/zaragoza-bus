import type { BusVehicle } from './bus-vehicles';
import { visibleVehicles } from './line-filter';
import type { BusStop, Coordinates } from './types';

/** Minutos que se asignan a un autobús sin llegadas para que quede el último al ordenar. */
const NO_ARRIVAL_MINUTES = Number.POSITIVE_INFINITY;

function nextArrivalMinutes(vehicle: BusVehicle): number {
  return vehicle.arrivals.length > 0 ? vehicle.arrivals[0].minutes : NO_ARRIVAL_MINUTES;
}

/**
 * Autobuses que se encuadran junto al poste: como mucho `limit`, los de menor `arrivals[0].minutes`.
 * Con filtro de línea (`line`, sin distinguir mayúsculas) solo cuentan los de esa línea.
 */
export function vehiclesToFrame(vehicles: readonly BusVehicle[], line: string | null, limit: number): BusVehicle[] {
  return [...visibleVehicles(vehicles, line)]
    .sort((first, second) => nextArrivalMinutes(first) - nextArrivalMinutes(second))
    .slice(0, Math.max(0, limit));
}

/** Puntos que debe abarcar el encuadre: el poste y las posiciones de los autobuses. */
export function framingPoints(stop: BusStop, vehicles: readonly BusVehicle[]): Coordinates[] {
  return [stop.coordinates, ...vehicles.map((vehicle) => vehicle.position)];
}
