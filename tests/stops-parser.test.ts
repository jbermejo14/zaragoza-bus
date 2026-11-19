import { test } from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../data/stops-snapshot.json';
import { parseStopListPage, parseStopTitle, StopsFormatError } from '../lib/stops-parser';

const SNAPSHOT_URBAN_STOP_COUNT = 983;

function item(id: string, title: string, coordinates: unknown = [-0.88, 41.65]) {
  return { id, title, geometry: { type: 'Point', coordinates } };
}

test('parseStopTitle: título normal', () => {
  assert.deepEqual(parseStopTitle('(666) P. Independencia N.º 25 Líneas: 38, 21'), {
    number: '666',
    name: 'P. Independencia N.º 25',
    lines: ['38', '21'],
  });
});

test('parseStopTitle: sin líneas', () => {
  assert.deepEqual(parseStopTitle('(8105) Plaza San Francisco Líneas: '), {
    number: '8105',
    name: 'Plaza San Francisco',
    lines: [],
  });
});

test('parseStopTitle: línea Ci1 y comas sobrantes', () => {
  assert.deepEqual(parseStopTitle('(12) Goya Líneas: Ci1, , 33,'), {
    number: '12',
    name: 'Goya',
    lines: ['Ci1', '33'],
  });
});

test('parseStopTitle: título que no casa devuelve null', () => {
  assert.equal(parseStopTitle('Sin formato'), null);
});

test('parseStopListPage: convierte coordenadas [lon, lat]', () => {
  const page = parseStopListPage({
    totalCount: 1,
    result: [item('tuzsa-666', '(666) Independencia Líneas: 38', [-0.8826, 41.6497])],
  });
  assert.deepEqual(page.stops, [
    {
      id: 'tuzsa-666',
      number: '666',
      name: 'Independencia',
      lines: ['38'],
      coordinates: { latitude: 41.6497, longitude: -0.8826 },
    },
  ]);
});

test('parseStopListPage: descarta rural, roto y duplicado; mantiene orden', () => {
  const page = parseStopListPage({
    totalCount: 1271,
    result: [
      item('tuzsa-1', '(1) Uno Líneas: 21'),
      item('rural-9', '(9) Rural Líneas: 1'),
      item('tuzsa-2', 'título roto'),
      item('tuzsa-3', '(3) Sin coords Líneas: 21', ['a', 41]),
      item('tuzsa-1', '(1) Duplicado Líneas: 22'),
      { id: 'tuzsa-4', title: '(4) Sin geometría Líneas: 21' },
      item('tuzsa-5', '(5) Cinco Líneas: 24'),
    ],
  });
  assert.deepEqual(page.stops.map((stop) => stop.id), ['tuzsa-1', 'tuzsa-5']);
  assert.equal(page.stops[0].name, 'Uno');
  assert.equal(page.rawCount, 7);
  assert.equal(page.totalCount, 1271);
});

test('parseStopListPage: sin totalCount numérico usa rawCount', () => {
  const page = parseStopListPage({ totalCount: '5', result: [item('tuzsa-1', '(1) Uno Líneas: 21')] });
  assert.equal(page.totalCount, 1);
});

test('parseStopListPage: errores de formato', () => {
  assert.throws(() => parseStopListPage(null), StopsFormatError);
  assert.throws(() => parseStopListPage('texto'), StopsFormatError);
  assert.throws(() => parseStopListPage({ totalCount: 1 }), /result/);
  assert.throws(() => parseStopListPage({ result: {} }), StopsFormatError);
});

test('parseStopListPage: la instantánea real produce 983 postes', () => {
  const page = parseStopListPage(snapshot);
  assert.equal(page.stops.length, SNAPSHOT_URBAN_STOP_COUNT);
  assert.ok(page.stops.every((stop) => stop.id.startsWith('tuzsa-')));
});
