import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeFailure, fetchArrivals, fetchStops } from '../lib/bus-source';
import type { FetchFunction } from '../lib/bus-source';
import { demoArrivals } from '../lib/demo-data';
import { arrivalsUrl } from '../lib/config';
import type { BusStop } from '../lib/types';

const NOW = new Date(1_800_000_000_000);
const TOTAL_COUNT = 1271;
const PAGE_SIZES = [500, 500, 271];

const STOP: BusStop = {
  id: 'tuzsa-104',
  number: '104',
  name: 'Poste de prueba',
  lines: ['35', '32'],
  coordinates: { latitude: 41.65, longitude: -0.88 },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function syntheticPage(offset: number, size: number): unknown {
  const result = Array.from({ length: size }, (_, index) => ({
    id: `tuzsa-${offset + index}`,
    title: `(${offset + index}) Calle ${offset + index} Líneas: 21, 24`,
    geometry: { type: 'Point', coordinates: [-0.88, 41.65] },
  }));
  return { totalCount: TOTAL_COUNT, start: offset, rows: size, result };
}

function abortError(): Error {
  const error = new Error('aborted');
  error.name = 'AbortError';
  return error;
}

test('fetchStops pagina en 3 páginas con start=0/500/1000', async () => {
  const urls: string[] = [];
  const fetchFn: FetchFunction = async (url) => {
    urls.push(url);
    const page = urls.length - 1;
    return jsonResponse(syntheticPage(page * 500, PAGE_SIZES[page]));
  };
  const result = await fetchStops(fetchFn);
  assert.equal(result.source, 'live');
  assert.equal(result.fallbackReason, undefined);
  assert.equal(result.data.length, TOTAL_COUNT);
  assert.equal(urls.length, 3);
  assert.ok(urls[0].endsWith('&rows=500&start=0'));
  assert.ok(urls[1].endsWith('&rows=500&start=500'));
  assert.ok(urls[2].endsWith('&rows=500&start=1000'));
});

test('fetchStops cae a demo con motivo si una página falla', async () => {
  let calls = 0;
  const fetchFn: FetchFunction = async () => {
    calls += 1;
    if (calls === 2) return jsonResponse({ status: 500, mensaje: 'caído' }, 500);
    return jsonResponse(syntheticPage(0, 500));
  };
  const result = await fetchStops(fetchFn);
  assert.equal(result.source, 'demo');
  assert.equal(result.data.length, 983);
  assert.match(result.fallbackReason ?? '', /HTTP 500: caído/);
});

test('fetchStops cae a demo con el mensaje de CORS ante un TypeError', async () => {
  const result = await fetchStops(async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.equal(result.source, 'demo');
  assert.equal(result.fallbackReason, 'No se pudo conectar con la API (red o CORS bloqueado).');
});

test('fetchStops cae a demo si la respuesta tiene formato inesperado', async () => {
  const result = await fetchStops(async () => jsonResponse({ totalCount: 3 }));
  assert.equal(result.source, 'demo');
  assert.match(result.fallbackReason ?? '', /^La API devolvió un formato inesperado: /);
});

test('fetchStops cae a demo si no queda ningún poste urbano', async () => {
  const result = await fetchStops(async () => jsonResponse({ totalCount: 0, result: [] }));
  assert.equal(result.source, 'demo');
  assert.ok(result.fallbackReason);
});

test('fetchStops cae a demo con mensaje de 8 s ante un aborto por tiempo', async () => {
  const result = await fetchStops(async () => {
    throw new DOMException('timeout', 'AbortError');
  });
  assert.equal(result.source, 'demo');
  assert.equal(result.fallbackReason, 'La API no respondió en 8 s.');
});

test('fetchArrivals con respuesta válida devuelve live', async () => {
  const urls: string[] = [];
  const fetchFn: FetchFunction = async (url) => {
    urls.push(url);
    return jsonResponse({ destinos: [{ linea: '35', destino: 'PARQUE GOYA.', primero: '4 minutos.', segundo: '16 minutos.' }] });
  };
  const result = await fetchArrivals(STOP, fetchFn, NOW);
  assert.equal(result.source, 'live');
  assert.deepEqual(result.data, [{ line: '35', destination: 'Parque Goya', firstMinutes: 4, secondMinutes: 16 }]);
  assert.deepEqual(urls, [arrivalsUrl(STOP.id)]);
});

test('fetchArrivals con 400 y mensaje de la API cae a demo con ese mensaje', async () => {
  const body = { status: 400, mensaje: 'NoHttpResponseException' };
  const result = await fetchArrivals(STOP, async () => jsonResponse(body, 400), NOW);
  assert.equal(result.source, 'demo');
  assert.deepEqual(result.data, demoArrivals(STOP, NOW));
  assert.equal(result.fallbackReason, 'La API respondió con error HTTP 400: NoHttpResponseException.');
});

test('fetchArrivals con cuerpo no JSON informa del código HTTP', async () => {
  const result = await fetchArrivals(STOP, async () => new Response('<html>', { status: 502 }), NOW);
  assert.equal(result.source, 'demo');
  assert.match(result.fallbackReason ?? '', /HTTP 502/);
});

test('fetchArrivals con TypeError y con aborto usa los mensajes de describeFailure', async () => {
  const network = await fetchArrivals(STOP, async () => Promise.reject(new TypeError('x')), NOW);
  assert.match(network.fallbackReason ?? '', /CORS/);
  const timeout = await fetchArrivals(STOP, async () => Promise.reject(abortError()), NOW);
  assert.equal(timeout.fallbackReason, 'La API no respondió en 8 s.');
});

test('fetchArrivals con formato inesperado cae a demo', async () => {
  const result = await fetchArrivals(STOP, async () => jsonResponse({ algo: 1 }), NOW);
  assert.equal(result.source, 'demo');
  assert.match(result.fallbackReason ?? '', /formato inesperado/);
});

test('describeFailure devuelve el message de otros errores y texto de no errores', () => {
  assert.equal(describeFailure(new Error('algo raro')), 'algo raro');
  assert.equal(describeFailure('cadena'), 'cadena');
});
