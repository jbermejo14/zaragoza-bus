import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BusVehicle } from '../lib/bus-vehicles';
import { vehicleTooltipText } from '../components/vehicle-layer';

function makeVehicle(overrides: Partial<BusVehicle>): BusVehicle {
  return {
    vehicle: '4709',
    line: '58',
    destination: 'FUENTE JUNQUERA',
    position: { latitude: 41.6269, longitude: -0.9073 },
    arrivals: [{ minutes: 21, km: 4 }],
    ...overrides,
  };
}

test('vehicleTooltipText compone línea, destino, coche y llegada', () => {
  assert.equal(vehicleTooltipText(makeVehicle({})), 'Línea 58 → Fuente Junquera · coche 4709 · 21 min (4 km)');
});

test('vehicleTooltipText separa varias llegadas con " / "', () => {
  const vehicle = makeVehicle({ arrivals: [{ minutes: 21, km: 4 }, { minutes: 51, km: 10 }] });
  assert.equal(vehicleTooltipText(vehicle), 'Línea 58 → Fuente Junquera · coche 4709 · 21 min (4 km) / 51 min (10 km)');
});

test('vehicleTooltipText omite el destino vacío y las llegadas ausentes', () => {
  assert.equal(vehicleTooltipText(makeVehicle({ destination: '', arrivals: [] })), 'Línea 58 · coche 4709');
});
