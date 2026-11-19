import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceMeters, formatDistance, nearestStops } from '../lib/geo';
import type { BusStop } from '../lib/types';

const ORIGIN = { latitude: 41.6516, longitude: -0.8806 };
const METERS_PER_LATITUDE_DEGREE = 111195;
const TOLERANCE_METERS = 50;

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
  const result = nearestStops(stops, ORIGIN, 10, 1500);
  assert.deepEqual(
    result.map((nearby) => nearby.stop.id),
    ['near', 'mid', 'mid2'],
  );
  assert.ok(result[0].distanceMeters < result[1].distanceMeters);
  assert.equal(nearestStops(stops, ORIGIN, 2, 1500).length, 2);
});

test('nearestStops sin postes cercanos devuelve lista vacía', () => {
  assert.deepEqual(nearestStops([makeStop('far', 0, 0)], ORIGIN, 8, 1500), []);
  assert.deepEqual(nearestStops([], ORIGIN, 8, 1500), []);
});

test('formatDistance', () => {
  assert.equal(formatDistance(0), '0 m');
  assert.equal(formatDistance(83), '80 m');
  assert.equal(formatDistance(447), '450 m');
  assert.equal(formatDistance(1234), '1,2 km');
  assert.equal(formatDistance(1000), '1,0 km');
  assert.equal(formatDistance(997), '1,0 km');
});
