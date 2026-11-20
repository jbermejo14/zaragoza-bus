import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeFailure } from '../lib/bus-source';
import type { FetchFunction } from '../lib/bus-source';
import { LINE_VEHICLES_TIMEOUT_MS, REQUEST_TIMEOUT_MS, lineVehiclesProxyUrl } from '../lib/config';
import { FormatError } from '../lib/format-error';
import { LineVehiclesFormatError, fetchLineVehicles, parseLineVehicles, pickSampleStops } from '../lib/line-vehicles';
import type { BusStop } from '../lib/types';

function stopAt(number: string, longitude: number, latitude = 41.65): BusStop {
  return { id: `tuzsa-${number}`, number, name: `Poste ${number}`, lines: ['25'], coordinates: { latitude, longitude } };
}

/** Diez postes en fila de oeste a este, separados de forma uniforme, desordenados en la lista. */
function rowOfStops(): BusStop[] {
  const stops = Array.from({ length: 10 }, (_, index) => stopAt(String(100 + index), -0.95 + index * 0.01));
  return [stops[4], stops[9], stops[0], stops[7], stops[2], stops[5], stops[1], stops[8], stops[3], stops[6]];
}

function validBus(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { coche: '4253', linea: '25', destino: 'LA CARTUJA', latitud: 41.66, longitud: -0.88, ...overrides };
}

function assertFormatError(json: unknown, message: RegExp): void {
  assert.throws(() => parseLineVehicles(json), (error) => {
    assert.ok(error instanceof LineVehiclesFormatError);
    assert.ok(error instanceof FormatError);
    assert.match(error.message, message);
    return true;
  });
}

test('pickSampleStops empieza por el poste más al oeste y reparte el resto por el recorrido', () => {
  const picked = pickSampleStops(rowOfStops(), 3);
  assert.deepEqual(picked.map((stop) => stop.number), ['100', '109', '104']);
});

test('pickSampleStops es determinista', () => {
  assert.deepEqual(pickSampleStops(rowOfStops(), 4), pickSampleStops(rowOfStops(), 4));
});

test('pickSampleStops devuelve todos si count supera las paradas, y vacío con count 0 o sin paradas', () => {
  const stops = rowOfStops();
  assert.deepEqual(pickSampleStops(stops, 20), stops);
  assert.deepEqual(pickSampleStops(stops, 0), []);
  assert.deepEqual(pickSampleStops([], 8), []);
});

test('pickSampleStops no repite postes', () => {
  const numbers = pickSampleStops(rowOfStops(), 8).map((stop) => stop.number);
  assert.equal(new Set(numbers).size, 8);
});

test('lineVehiclesProxyUrl lleva la línea y los postes separados por comas', () => {
  assert.equal(
    lineVehiclesProxyUrl('25', ['104', '2050', '77']),
    '/es/zaragoza-bus/api/gps-linea/25?postes=104,2050,77',
  );
  assert.equal(lineVehiclesProxyUrl('Ci1', ['9']), '/es/zaragoza-bus/api/gps-linea/Ci1?postes=9');
});

test('parseLineVehicles convierte un caso válido, sin llegadas', () => {
  const body = { linea: '25', autobuses: [validBus()], postesConsultados: 8, postesFallidos: 0 };
  assert.deepEqual(parseLineVehicles(body), [
    {
      vehicle: '4253',
      line: '25',
      destination: 'LA CARTUJA',
      position: { latitude: 41.66, longitude: -0.88 },
      arrivals: [],
    },
  ]);
});

test('parseLineVehicles admite lista vacía y destino ausente', () => {
  assert.deepEqual(parseLineVehicles({ autobuses: [] }), []);
  assert.equal(parseLineVehicles({ autobuses: [validBus({ destino: undefined })] })[0].destination, '');
});

test('parseLineVehicles rechaza formatos inválidos', () => {
  assertFormatError(null, /no es un objeto/);
  assertFormatError([], /no es un objeto/);
  assertFormatError({}, /"autobuses"/);
  assertFormatError({ autobuses: [3] }, /autobús 0 no es un objeto/);
  assertFormatError({ autobuses: [validBus({ coche: '' })] }, /"coche"/);
  assertFormatError({ autobuses: [validBus({ linea: undefined })] }, /"linea"/);
  assertFormatError({ autobuses: [validBus({ destino: 5 })] }, /"destino"/);
  assertFormatError({ autobuses: [validBus({ latitud: Number.NaN })] }, /latitud/);
  assertFormatError({ autobuses: [validBus({ longitud: '1' })] }, /longitud/);
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('fetchLineVehicles pide la URL del proxy y analiza la respuesta', async () => {
  const requested: string[] = [];
  const fetchFn: FetchFunction = async (url) => {
    requested.push(url);
    return jsonResponse(200, { autobuses: [validBus()] });
  };
  const vehicles = await fetchLineVehicles('25', ['104', '105'], fetchFn);
  assert.deepEqual(requested, ['/es/zaragoza-bus/api/gps-linea/25?postes=104,105']);
  assert.equal(vehicles.length, 1);
});

test('fetchLineVehicles lanza con HTTP 502 y el mensaje del Worker', async () => {
  const fetchFn: FetchFunction = async () => jsonResponse(502, { error: 'Avanza no responde.' });
  await assert.rejects(fetchLineVehicles('25', ['104'], fetchFn), (error) => {
    assert.match(describeFailure(error), /502.*Avanza no responde/);
    return true;
  });
});

test('fetchLineVehicles lanza un error de formato si el JSON no es válido', async () => {
  const fetchFn: FetchFunction = async () => jsonResponse(200, { autobuses: 'no' });
  await assert.rejects(fetchLineVehicles('25', ['104'], fetchFn), (error) => {
    assert.ok(error instanceof LineVehiclesFormatError);
    assert.match(describeFailure(error), /formato inesperado/);
    return true;
  });
});

test('fetchLineVehicles espera hasta 30 s y aborta al cumplirse', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let aborted = false;
  const fetchFn: FetchFunction = (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        aborted = true;
        reject(new Error('abortado'));
      });
    });
  const pending = fetchLineVehicles('25', ['104'], fetchFn);
  const settled = assert.rejects(pending, /abortado/);
  context.mock.timers.tick(REQUEST_TIMEOUT_MS);
  assert.equal(aborted, false, 'no debe abortar con el tiempo por defecto de 8 s');
  context.mock.timers.tick(LINE_VEHICLES_TIMEOUT_MS - REQUEST_TIMEOUT_MS);
  await settled;
  assert.equal(aborted, true);
});
