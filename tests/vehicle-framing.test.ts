import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BusVehicle } from '../lib/bus-vehicles';
import { framingPoints, vehiclesToFrame } from '../lib/vehicle-framing';
import type { BusStop } from '../lib/types';

function makeVehicle(vehicle: string, line: string, minutes: number | null): BusVehicle {
  return {
    vehicle,
    line,
    destination: 'DESTINO',
    position: { latitude: 41.6 + Number(vehicle) / 1000, longitude: -0.9 },
    arrivals: minutes === null ? [] : [{ minutes, km: 1 }],
  };
}

const STOP = { coordinates: { latitude: 41.65, longitude: -0.88 } } as BusStop;
const FRAME_LIMIT = 3;

test('vehiclesToFrame devuelve los de menor tiempo, con el límite', () => {
  const vehicles = [makeVehicle('1', '58', 30), makeVehicle('2', '58', 5), makeVehicle('3', '22', 12), makeVehicle('4', '58', 8)];
  assert.deepEqual(
    vehiclesToFrame(vehicles, null, FRAME_LIMIT).map((vehicle) => vehicle.vehicle),
    ['2', '4', '3'],
  );
});

test('vehiclesToFrame respeta el filtro de línea sin distinguir mayúsculas', () => {
  const vehicles = [makeVehicle('1', 'CI1', 30), makeVehicle('2', '58', 5), makeVehicle('3', 'ci1', 12)];
  assert.deepEqual(
    vehiclesToFrame(vehicles, 'Ci1', FRAME_LIMIT).map((vehicle) => vehicle.vehicle),
    ['3', '1'],
  );
});

test('vehiclesToFrame deja al final los autobuses sin llegadas y no altera la entrada', () => {
  const vehicles = [makeVehicle('1', '58', null), makeVehicle('2', '58', 9)];
  assert.deepEqual(
    vehiclesToFrame(vehicles, null, FRAME_LIMIT).map((vehicle) => vehicle.vehicle),
    ['2', '1'],
  );
  assert.equal(vehicles[0].vehicle, '1');
});

test('vehiclesToFrame con límite 0 o sin autobuses devuelve vacío', () => {
  assert.deepEqual(vehiclesToFrame([makeVehicle('1', '58', 1)], null, 0), []);
  assert.deepEqual(vehiclesToFrame([], null, FRAME_LIMIT), []);
});

test('framingPoints pone primero el poste y luego los autobuses', () => {
  const vehicles = [makeVehicle('1', '58', 1), makeVehicle('2', '58', 2)];
  assert.deepEqual(framingPoints(STOP, vehicles), [STOP.coordinates, vehicles[0].position, vehicles[1].position]);
  assert.deepEqual(framingPoints(STOP, []), [STOP.coordinates]);
});
