import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ArrivalsFormatError, cleanDestination, parseArrivals, parseMinutes } from '../lib/arrivals-parser';

test('parseMinutes interpreta números', () => {
  assert.equal(parseMinutes(4), 4);
  assert.equal(parseMinutes(3.6), 4);
  assert.equal(parseMinutes(0), 0);
  assert.equal(parseMinutes(-1), null);
  assert.equal(parseMinutes(Number.NaN), null);
  assert.equal(parseMinutes(Number.POSITIVE_INFINITY), null);
});

test('parseMinutes interpreta cadenas', () => {
  assert.equal(parseMinutes('4 minutos.'), 4);
  assert.equal(parseMinutes('16 minutos.'), 16);
  assert.equal(parseMinutes('En la parada.'), 0);
  assert.equal(parseMinutes('LLEGANDO'), 0);
  assert.equal(parseMinutes('Inminente'), 0);
  assert.equal(parseMinutes('Llegándo'), 0);
  assert.equal(parseMinutes('EN LA PARADA'), 0);
  assert.equal(parseMinutes('Sin estimacin.'), null);
  assert.equal(parseMinutes(''), null);
});

test('parseMinutes devuelve null para otros tipos', () => {
  assert.equal(parseMinutes(null), null);
  assert.equal(parseMinutes(undefined), null);
  assert.equal(parseMinutes({}), null);
});

test('cleanDestination pasa a tipo título', () => {
  assert.equal(cleanDestination('PARQUE GOYA.'), 'Parque Goya');
  assert.equal(cleanDestination('BOMBARDA,'), 'Bombarda');
  assert.equal(cleanDestination('LAS FUENTES'), 'Las Fuentes');
  assert.equal(cleanDestination('  PLAZA DE LA MARINA ESPAÑOLA. '), 'Plaza de la Marina Española');
  assert.equal(cleanDestination('DEL PILAR'), 'Del Pilar');
  assert.equal(cleanDestination(''), '');
});

test('parseArrivals convierte el ejemplo de la API', () => {
  const result = parseArrivals({
    id: 'tuzsa-104',
    destinos: [
      { linea: '35', destino: 'PARQUE GOYA.', primero: '4 minutos.', segundo: '16 minutos.' },
      { linea: '32', destino: 'BOMBARDA,', primero: 'En la parada.', segundo: 'Sin estimacin.' },
    ],
  });
  assert.deepEqual(result, [
    { line: '32', destination: 'Bombarda', firstMinutes: 0, secondMinutes: null },
    { line: '35', destination: 'Parque Goya', firstMinutes: 4, secondMinutes: 16 },
  ]);
});

test('parseArrivals descarta elementos sin línea', () => {
  const result = parseArrivals({
    destinos: [{ destino: 'X', primero: '1 minutos.' }, null, { linea: '21', destino: 'A', primero: '2 minutos.' }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].line, '21');
});

test('parseArrivals descarta linea vacía, en blanco o no textual', () => {
  const result = parseArrivals({
    destinos: [
      { linea: '', destino: 'A', primero: '1 minutos.' },
      { linea: '  ', destino: 'B', primero: '1 minutos.' },
      { linea: 21, destino: 'C', primero: '1 minutos.' },
      { linea: '35', destino: 'D', primero: '2 minutos.' },
    ],
  });
  assert.deepEqual(
    result.map((arrival) => arrival.line),
    ['35'],
  );
});

test('parseArrivals une filas del mismo grupo y conserva los dos menores', () => {
  const result = parseArrivals({
    destinos: [
      { linea: '21', destino: 'CENTRO.', primero: '12 minutos.', segundo: 'Sin estimacin.' },
      { linea: '21', destino: 'Centro', primero: '3 minutos.', segundo: '25 minutos.' },
    ],
  });
  assert.deepEqual(result, [{ line: '21', destination: 'Centro', firstMinutes: 3, secondMinutes: 12 }]);
});

test('parseArrivals ordena por minutos con nulos al final y desempata por línea', () => {
  const result = parseArrivals({
    destinos: [
      { linea: '30', destino: 'A', primero: 'Sin estimacin.', segundo: '' },
      { linea: '24', destino: 'B', primero: '5 minutos.', segundo: '' },
      { linea: '9', destino: 'C', primero: '5 minutos.', segundo: '' },
      { linea: '100', destino: 'D', primero: '1 minutos.', segundo: '' },
    ],
  });
  assert.deepEqual(
    result.map((arrival) => arrival.line),
    ['100', '9', '24', '30'],
  );
  assert.equal(result[3].firstMinutes, null);
});

test('parseArrivals lanza ArrivalsFormatError ante formatos inválidos', () => {
  assert.throws(() => parseArrivals(null), ArrivalsFormatError);
  assert.throws(() => parseArrivals('texto'), ArrivalsFormatError);
  assert.throws(() => parseArrivals([]), ArrivalsFormatError);
  assert.throws(() => parseArrivals({ id: 'x' }), ArrivalsFormatError);
  assert.throws(() => parseArrivals({ destinos: 'no' }), ArrivalsFormatError);
});

test('parseArrivals incluye el mensaje de la API cuando status >= 400', () => {
  assert.throws(
    () => parseArrivals({ status: 400, mensaje: 'NoHttpResponseException' }),
    (error: unknown) => error instanceof ArrivalsFormatError && error.message.includes('NoHttpResponseException'),
  );
});

test('parseArrivals lanza con status >= 400 aunque no haya mensaje', () => {
  assert.throws(() => parseArrivals({ status: 500 }), /500.*sin mensaje/);
});

test('parseArrivals no lanza con status 200', () => {
  assert.deepEqual(parseArrivals({ status: 200, destinos: [] }), []);
});

test('parseArrivals acepta destinos vacío', () => {
  assert.deepEqual(parseArrivals({ destinos: [] }), []);
});
