import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoArrivals, demoStops } from '../lib/demo-data';
import type { BusStop } from '../lib/types';

const WINDOW_MS = 30_000;
const BASE_TIME = 1_800_000_000_000 - (1_800_000_000_000 % WINDOW_MS);

function makeStop(id: string, lines: string[]): BusStop {
  return { id, number: id.replace('tuzsa-', ''), name: 'Poste de prueba', lines, coordinates: { latitude: 41.65, longitude: -0.88 } };
}

test('demoStops devuelve los 983 postes urbanos de la instantánea', () => {
  assert.equal(demoStops().length, 983);
});

test('demoArrivals es determinista dentro de la misma ventana de 30 s', () => {
  const stop = makeStop('tuzsa-104', ['35', '32', '24']);
  const first = demoArrivals(stop, new Date(BASE_TIME));
  const second = demoArrivals(stop, new Date(BASE_TIME + WINDOW_MS - 1));
  assert.deepEqual(first, second);
});

test('demoArrivals cambia entre ventanas de 30 s', () => {
  const stop = makeStop('tuzsa-104', ['35', '32', '24', '21', '38']);
  const signatures = new Set<string>();
  for (let window = 0; window < 10; window += 1) {
    signatures.add(JSON.stringify(demoArrivals(stop, new Date(BASE_TIME + window * WINDOW_MS))));
  }
  assert.ok(signatures.size > 1);
});

test('los minutos están en rango y el segundo es posterior al primero', () => {
  const stops = demoStops().filter((stop) => stop.lines.length > 0).slice(0, 200);
  let missingSecond = 0;
  let total = 0;
  for (const stop of stops) {
    for (const arrival of demoArrivals(stop, new Date(BASE_TIME))) {
      total += 1;
      assert.ok(arrival.firstMinutes !== null && arrival.firstMinutes >= 0 && arrival.firstMinutes <= 15);
      if (arrival.secondMinutes === null) {
        missingSecond += 1;
      } else {
        const gap = arrival.secondMinutes - arrival.firstMinutes;
        assert.ok(gap >= 6 && gap <= 18, `hueco fuera de rango: ${gap}`);
      }
    }
  }
  assert.ok(missingSecond > 0 && missingSecond < total / 2);
});

test('hay llegadas con 0 minutos (Llegando) en algún poste o ventana', () => {
  const stop = makeStop('tuzsa-1', ['21', '22', '23', '24', '25', '28']);
  let seenZero = false;
  for (let window = 0; window < 50; window += 1) {
    const arrivals = demoArrivals(stop, new Date(BASE_TIME + window * WINDOW_MS));
    if (arrivals.some((arrival) => arrival.firstMinutes === 0)) seenZero = true;
  }
  assert.ok(seenZero);
});

test('un poste sin líneas no tiene llegadas', () => {
  assert.deepEqual(demoArrivals(makeStop('tuzsa-8105', []), new Date(BASE_TIME)), []);
});

test('la línea 24 tiene algún destino «Las Fuentes»', () => {
  const destinations = new Set<string>();
  for (let index = 0; index < 40; index += 1) {
    const [arrival] = demoArrivals(makeStop(`tuzsa-${index}`, ['24']), new Date(BASE_TIME));
    destinations.add(arrival.destination);
  }
  assert.ok(destinations.has('Las Fuentes'));
});

test('una línea no listada usa Plaza España o su cabecera genérica', () => {
  const [arrival] = demoArrivals(makeStop('tuzsa-5', ['99']), new Date(BASE_TIME));
  assert.ok(['Plaza España', '99 Cabecera'].includes(arrival.destination));
});

test('las llegadas salen ordenadas por primer minuto y después por línea', () => {
  const stop = makeStop('tuzsa-104', ['35', '32', '24', '21', '38', 'Ci1', 'N4']);
  for (let window = 0; window < 20; window += 1) {
    const arrivals = demoArrivals(stop, new Date(BASE_TIME + window * WINDOW_MS));
    assert.equal(arrivals.length, stop.lines.length);
    for (let index = 1; index < arrivals.length; index += 1) {
      const previous = arrivals[index - 1];
      const current = arrivals[index];
      const previousFirst = previous.firstMinutes as number;
      const currentFirst = current.firstMinutes as number;
      assert.ok(previousFirst < currentFirst || (previousFirst === currentFirst && previous.line.localeCompare(current.line, 'es', { numeric: true }) <= 0));
    }
  }
});
