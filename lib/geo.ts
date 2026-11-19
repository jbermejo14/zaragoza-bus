import type { BusStop, Coordinates } from './types';

const EARTH_RADIUS_METERS = 6371008.8;
const DEGREES_TO_RADIANS = Math.PI / 180;
const METERS_PER_KILOMETER = 1000;
const METERS_ROUNDING_STEP = 10;

/** Poste con su distancia al punto de origen. */
export interface NearbyStop {
  stop: BusStop;
  distanceMeters: number;
}

/** Distancia en metros entre dos coordenadas (fórmula de haversine). */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const latitudeA = a.latitude * DEGREES_TO_RADIANS;
  const latitudeB = b.latitude * DEGREES_TO_RADIANS;
  const deltaLatitude = latitudeB - latitudeA;
  const deltaLongitude = (b.longitude - a.longitude) * DEGREES_TO_RADIANS;
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

/** Postes a no más de maxDistanceMeters del origen, del más cercano al más lejano, hasta limit. */
export function nearestStops(
  stops: readonly BusStop[],
  origin: Coordinates,
  limit: number,
  maxDistanceMeters: number,
): NearbyStop[] {
  return stops
    .map((stop) => ({ stop, distanceMeters: distanceMeters(origin, stop.coordinates) }))
    .filter((nearby) => nearby.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

/** Formatea una distancia: "80 m" (múltiplos de 10 por debajo de 1000 m) o "1,2 km". */
export function formatDistance(meters: number): string {
  const rounded = Math.round(meters / METERS_ROUNDING_STEP) * METERS_ROUNDING_STEP;
  if (rounded < METERS_PER_KILOMETER) {
    return `${rounded} m`;
  }
  return `${(meters / METERS_PER_KILOMETER).toFixed(1).replace('.', ',')} km`;
}
