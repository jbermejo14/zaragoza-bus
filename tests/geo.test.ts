import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceMeters, formatDistance, nearestStops } from '../lib/geo';
import type { BusStop } from '../lib/types';

const ORIGIN = { latitude: 41.6516, longitude: -0.8806 };
const METERS_PER_LATITUDE_DEGREE = 111195;
const TOLERANCE_METERS = 50;
const NEARBY_LIMIT = 10;
const SMALL_LIMIT = 2;
const MAX_DISTANCE_METERS = 1500;

function makeStop(id: string, latitude: number, longitude: number): BusStop {
  return { id, number: id, name: id, lines: [], coordinates: { latitude, longitude } };
}

test('distanceMeters es 0 entre el mismo punto', () => {
  assert.equal(distanceMeters(ORIGIN, ORIGIN), 0);
});

test('distanceMeters: un grado de latitud son unos 111 195 m', () => {
  const north = { latitude: ORIGIN.latitude + 1, longitude: ORIGIN.longitude };
  assert.ok(Math.abs(distanceMeters(ORIGIN, north) - METERS_PER_LATITUDE_DEGREE) < TOLERANCE_METERS);
});

test('distanceMeters es simétrica', () => {
  const other = { latitude: 41.66, longitude: -0.89 };
  assert.equal(distanceMeters(ORIGIN, other), distanceMeters(other, ORIGIN));
});

test('distanceMeters: un grado de longitud en el ecuador son unos 111 195 m', () => {
  const a = { latitude: 0, longitude: 0 };
  const b = { latitude: 0, longitude: 1 };
  assert.ok(Math.abs(distanceMeters(a, b) - METERS_PER_LATITUDE_DEGREE) < TOLERANCE_METERS);
});

test('nearestStops ordena, filtra por distancia y aplica el límite', () => {
  const stops = [
    makeStop('far', ORIGIN.latitude + 0.05, ORIGIN.longitude),
    makeStop('mid', ORIGIN.latitude + 0.002, ORIGIN.longitude),
    makeStop('near', ORIGIN.latitude + 0.0005, ORIGIN.longitude),
    makeStop('mid2', ORIGIN.latitude, ORIGIN.longitude + 0.003),
  ];
  const result = nearestStops(stops, ORIGIN, NEARBY_LIMIT, MAX_DISTANCE_METERS);
  assert.deepEqual(
    result.map((nearby) => nearby.stop.id),
    ['near', 'mid', 'mid2'],
  );
  assert.ok(result[0].distanceMeters < result[1].distanceMeters);
  assert.equal(nearestStops(stops, ORIGIN, SMALL_LIMIT, MAX_DISTANCE_METERS).length, 2);
});

test('nearestStops incluye un poste justo en maxDistanceMeters', () => {
  const stop = makeStop('edge', ORIGIN.latitude + 0.004, ORIGIN.longitude);
  const exact = distanceMeters(ORIGIN, stop.coordinates);
  assert.equal(nearestStops([stop], ORIGIN, NEARBY_LIMIT, exact).length, 1);
  assert.equal(nearestStops([stop], ORIGIN, NEARBY_LIMIT, exact - 1).length, 0);
});

test('nearestStops sin postes cercanos devuelve lista vacía', () => {
  assert.deepEqual(nearestStops([makeStop('far', 0, 0)], ORIGIN, NEARBY_LIMIT, MAX_DISTANCE_METERS), []);
  assert.deepEqual(nearestStops([], ORIGIN, NEARBY_LIMIT, MAX_DISTANCE_METERS), []);
});

test('formatDistance', () => {
  assert.equal(formatDistance(0), '0 m');
  assert.equal(formatDistance(83), '80 m');
  assert.equal(formatDistance(447), '450 m');
  assert.equal(formatDistance(1234), '1,2 km');
  assert.equal(formatDistance(1000), '1,0 km');
  assert.equal(formatDistance(997), '1,0 km');
  assert.equal(formatDistance(994), '990 m');
  assert.equal(formatDistance(999), '1,0 km');
  assert.equal(formatDistance(1960), '2,0 km');
});
