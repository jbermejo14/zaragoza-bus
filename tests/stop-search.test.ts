import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEARCH_RESULT_LIMIT } from '../lib/config';
import { compareLines, findStopByNumber, listLines, searchStops } from '../lib/stop-search';
import type { BusStop } from '../lib/types';

function makeStop(number: string, name: string, lines: string[]): BusStop {
  return { id: `tuzsa-${number}`, number, name, lines, coordinates: { latitude: 41.65, longitude: -0.88 } };
}

const STOPS: BusStop[] = [
  makeStop('1040', 'Calle Goya 4', ['35']),
  makeStop('10', 'Plaza Aragón', ['Ci1', '21']),
  makeStop('104', 'P. Independencia N.º 25', ['38', '21']),
  makeStop('105', 'Paseo de la Independencia 2', ['Ci1']),
  makeStop('200', 'Avenida Goya', ['N1']),
  makeStop('300', 'Calle Mayor', []),
  makeStop('1041', 'Gran Vía', ['C1']),
];

function numbers(stops: BusStop[]): string[] {
  return stops.map((stop) => stop.number);
}

test('consulta vacía sin línea devuelve []', () => {
  assert.deepEqual(searchStops(STOPS, '   ', null), []);
});

test('consulta vacía con línea devuelve los de la línea por número', () => {
  assert.deepEqual(numbers(searchStops(STOPS, '', 'ci1')), ['10', '105']);
});

test('consulta numérica: exacto primero, luego longitud y número', () => {
  assert.deepEqual(numbers(searchStops(STOPS, '104', null)), ['104', '1040', '1041']);
});

test('consulta numérica combinada con línea', () => {
  assert.deepEqual(numbers(searchStops(STOPS, '104', '35')), ['1040']);
});

test('búsqueda por nombre ignora tildes y mayúsculas', () => {
  assert.deepEqual(numbers(searchStops(STOPS, 'ARAGON', null)), ['10']);
});

test('búsqueda por nombre exige todos los tokens', () => {
  assert.deepEqual(numbers(searchStops(STOPS, 'independencia 25', null)), ['104']);
  assert.deepEqual(searchStops(STOPS, 'independencia goya', null), []);
});

test('nombre: inicio de palabra antes que subcadena, luego por nombre', () => {
  const stops = [makeStop('1', 'Calle Rebola', ['1']), makeStop('2', 'Bola Alta', ['1']), makeStop('3', 'Bolas', ['1'])];
  assert.deepEqual(numbers(searchStops(stops, 'bola', null)), ['2', '3', '1']);
});

test('consulta vacía con línea ordena los números de forma numérica', () => {
  const stops = [makeStop('105', 'C', ['7']), makeStop('10', 'B', ['7']), makeStop('9', 'A', ['7'])];
  assert.deepEqual(numbers(searchStops(stops, '', '7')), ['9', '10', '105']);
});

test('consulta solo de símbolos sin línea equivale a vacía', () => {
  assert.deepEqual(searchStops(STOPS, '.', null), []);
});

test('nombre: mismo nombre se desempata por número', () => {
  const stops = [makeStop('20', 'Calle Sol', ['1']), makeStop('3', 'Calle Sol', ['1']), makeStop('100', 'Calle Sol', ['1'])];
  assert.deepEqual(numbers(searchStops(stops, 'sol', null)), ['3', '20', '100']);
});

test('nombre: sin inicio de palabra se ordena por nombre', () => {
  const stops = [makeStop('1', 'Zzbola', ['1']), makeStop('2', 'Aabola', ['1'])];
  assert.deepEqual(numbers(searchStops(stops, 'bola', null)), ['2', '1']);
});

test('el límite recorta los resultados', () => {
  assert.equal(searchStops(STOPS, 'a', null, 2).length, 2);
});

test('el límite por defecto es SEARCH_RESULT_LIMIT', () => {
  const many = Array.from({ length: SEARCH_RESULT_LIMIT + 20 }, (_, index) => makeStop(String(index), 'Calle', ['1']));
  assert.equal(searchStops(many, 'calle', null).length, SEARCH_RESULT_LIMIT);
});

test('compareLines: numéricas, Ci, C, N y resto', () => {
  const sorted = ['N1', 'Z9', 'C1', 'Ci2', '30', 'Ci1', '9', 'N10', 'N2'].sort(compareLines);
  assert.deepEqual(sorted, ['9', '30', 'Ci1', 'Ci2', 'C1', 'N1', 'N2', 'N10', 'Z9']);
});

test('compareLines: orden natural dentro del grupo', () => {
  assert.ok(compareLines('Ci2', 'Ci10') < 0);
});

test('listLines devuelve líneas distintas ordenadas', () => {
  assert.deepEqual(listLines(STOPS), ['21', '35', '38', 'Ci1', 'C1', 'N1']);
});

test('findStopByNumber: exacto o null', () => {
  assert.equal(findStopByNumber(STOPS, '104')?.id, 'tuzsa-104');
  assert.equal(findStopByNumber(STOPS, '10400'), null);
  assert.equal(findStopByNumber(STOPS, '1'), null);
});
