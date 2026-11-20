import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BusVehicle } from '../lib/bus-vehicles';
import { arrivalsForLine, stopsForLine, visibleVehicles } from '../lib/line-filter';
import type { Arrival, BusStop } from '../lib/types';

function makeStop(number: string, lines: string[]): BusStop {
  return { id: `tuzsa-${number}`, number, name: `Poste ${number}`, lines, coordinates: { latitude: 41.65, longitude: -0.88 } };
}

function makeArrival(line: string, destination: string): Arrival {
  return { line, destination, firstMinutes: 3, secondMinutes: 12 };
}

const STOPS: BusStop[] = [makeStop('1', ['21', 'Ci1']), makeStop('2', ['35']), makeStop('3', [])];
const ARRIVALS: Arrival[] = [makeArrival('21', 'Las Fuentes'), makeArrival('Ci1', 'Circular'), makeArrival('21', 'Valdespartera')];

test('stopsForLine sin línea devuelve todos los postes', () => {
  assert.deepEqual(stopsForLine(STOPS, null), STOPS);
});

test('stopsForLine deja solo los postes de la línea', () => {
  assert.deepEqual(stopsForLine(STOPS, '21').map((stop) => stop.number), ['1']);
  assert.deepEqual(stopsForLine(STOPS, '35').map((stop) => stop.number), ['2']);
});

test('stopsForLine no distingue mayúsculas y no confunde prefijos', () => {
  assert.deepEqual(stopsForLine(STOPS, 'ci1').map((stop) => stop.number), ['1']);
  assert.deepEqual(stopsForLine(STOPS, '2'), []);
});

test('stopsForLine con una línea que nadie tiene devuelve una lista vacía', () => {
  assert.deepEqual(stopsForLine(STOPS, '99'), []);
});

test('arrivalsForLine sin línea devuelve todas las llegadas', () => {
  assert.deepEqual(arrivalsForLine(ARRIVALS, null), ARRIVALS);
});

test('arrivalsForLine deja las llegadas de la línea, en su orden', () => {
  assert.deepEqual(arrivalsForLine(ARRIVALS, '21').map((arrival) => arrival.destination), ['Las Fuentes', 'Valdespartera']);
});

test('arrivalsForLine no distingue mayúsculas y puede quedar vacío', () => {
  assert.equal(arrivalsForLine(ARRIVALS, 'CI1').length, 1);
  assert.deepEqual(arrivalsForLine(ARRIVALS, '35'), []);
});

function makeVehicle(line: string): BusVehicle {
  return { vehicle: '4709', line, destination: 'Fuente Junquera', position: { latitude: 41.65, longitude: -0.88 }, arrivals: [] };
}

const VEHICLES: BusVehicle[] = [makeVehicle('58'), makeVehicle('Ci1'), makeVehicle('58')];

test('visibleVehicles sin línea devuelve todos los autobuses', () => {
  assert.deepEqual(visibleVehicles(VEHICLES, null), VEHICLES);
});

test('visibleVehicles deja solo los de la línea, sin distinguir mayúsculas ni prefijos', () => {
  assert.equal(visibleVehicles(VEHICLES, '58').length, 2);
  assert.deepEqual(visibleVehicles(VEHICLES, 'ci1').map((vehicle) => vehicle.line), ['Ci1']);
  assert.deepEqual(visibleVehicles(VEHICLES, '5'), []);
});
