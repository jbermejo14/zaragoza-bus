import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeFailure, fetchArrivals, fetchStops } from '../lib/bus-source';
import type { FetchFunction } from '../lib/bus-source';
import { demoArrivals } from '../lib/demo-data';
import { REQUEST_TIMEOUT_MS, arrivalsProxyUrl, arrivalsUrl } from '../lib/config';
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

/** Motivo esperado cuando proxy y API municipal fallan exactamente igual. */
function bothFailed(reason: string): string {
  return `Proxy: ${reason} API municipal: ${reason}`;
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
  assert.deepEqual(urls, [arrivalsProxyUrl(STOP.number)]);
});

test('fetchArrivals con 400 y mensaje de la API cae a demo con ese mensaje', async () => {
  const body = { status: 400, mensaje: 'NoHttpResponseException' };
  const result = await fetchArrivals(STOP, async () => jsonResponse(body, 400), NOW);
  assert.equal(result.source, 'demo');
  assert.deepEqual(result.data, demoArrivals(STOP, NOW));
  assert.equal(result.fallbackReason, bothFailed('La API respondió con error HTTP 400: NoHttpResponseException.'));
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
  assert.equal(timeout.fallbackReason, bothFailed('La API no respondió en 8 s.'));
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

const ONE_PAGE_ROWS = 500;
const MAX_PAGES = 10;

function fetchRespectingSignal(): FetchFunction {
  return (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(abortError()));
    });
}

function pageOfStops(ids: number[], totalCount?: number): Response {
  const result = ids.map((id) => ({
    id: `tuzsa-${id}`,
    title: `(${id}) Calle ${id} Líneas: 21`,
    geometry: { type: 'Point', coordinates: [-0.88, 41.65] },
  }));
  return jsonResponse(totalCount === undefined ? { result } : { totalCount, result });
}

function idRange(from: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => from + index);
}

test('el temporizador aborta de verdad la petición pasado el tiempo límite', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = fetchArrivals(STOP, fetchRespectingSignal(), NOW);
  context.mock.timers.tick(REQUEST_TIMEOUT_MS);
  // Deja que el fallo del proxy se propague y arranque la petición a la API municipal.
  await new Promise((resolve) => setImmediate(resolve));
  context.mock.timers.tick(REQUEST_TIMEOUT_MS);
  const result = await pending;
  assert.equal(result.source, 'demo');
  assert.equal(result.fallbackReason, bothFailed('La API no respondió en 8 s.'));
});

test('un aborto durante la lectura del cuerpo se describe como tiempo agotado', async () => {
  const response = { ok: true, status: 200, statusText: 'OK', json: async () => Promise.reject(abortError()) };
  const result = await fetchArrivals(STOP, async () => response as unknown as Response, NOW);
  assert.equal(result.fallbackReason, bothFailed('La API no respondió en 8 s.'));
});

test('fetchStops deduplica postes repetidos entre páginas', async () => {
  const pages = [pageOfStops(idRange(0, 3), 6), pageOfStops(idRange(1, 5), 6)];
  let calls = 0;
  const result = await fetchStops(async () => pages[calls++]);
  assert.equal(result.source, 'live');
  assert.equal(result.data.length, 6);
  assert.equal(new Set(result.data.map((stop) => stop.id)).size, 6);
});

test('fetchStops para la paginación ante una página vacía', async () => {
  let calls = 0;
  const result = await fetchStops(async () => {
    calls += 1;
    return calls === 1 ? pageOfStops(idRange(0, ONE_PAGE_ROWS), 5000) : pageOfStops([], 5000);
  });
  assert.equal(calls, 2);
  assert.equal(result.source, 'live');
  assert.equal(result.data.length, ONE_PAGE_ROWS);
});

test('fetchStops no pide más de 10 páginas aunque totalCount sea enorme', async () => {
  let calls = 0;
  const result = await fetchStops(async () => {
    const page = calls;
    calls += 1;
    return pageOfStops(idRange(page * ONE_PAGE_ROWS, ONE_PAGE_ROWS), 1_000_000);
  });
  assert.equal(calls, MAX_PAGES);
  assert.equal(result.data.length, MAX_PAGES * ONE_PAGE_ROWS);
});

test('fetchStops sin totalCount se queda en una sola página', async () => {
  let calls = 0;
  const result = await fetchStops(async () => {
    calls += 1;
    return pageOfStops(idRange(0, 4));
  });
  assert.equal(calls, 1);
  assert.equal(result.data.length, 4);
});

test('fetchStops con resultado vacío da el motivo exacto', async () => {
  const result = await fetchStops(async () => jsonResponse({ totalCount: 0, result: [] }));
  assert.equal(result.fallbackReason, 'La API no devolvió ningún poste urbano.');
});

test('una respuesta 200 con cuerpo no JSON es un error de formato, no un error HTTP', async () => {
  const result = await fetchArrivals(STOP, async () => new Response('<html>', { status: 200 }), NOW);
  assert.equal(result.source, 'demo');
  assert.equal(
    result.fallbackReason,
    bothFailed('La API devolvió un formato inesperado: el cuerpo de la respuesta no es JSON'),
  );
});

test('un 500 con JSON sin mensaje y sin statusText dice «sin detalle»', async () => {
  const result = await fetchArrivals(STOP, async () => jsonResponse({ status: 500 }, 500), NOW);
  assert.equal(result.fallbackReason, bothFailed('La API respondió con error HTTP 500: sin detalle.'));
});

test('un mensaje de la API con punto final no duplica el punto', async () => {
  const result = await fetchArrivals(STOP, async () => jsonResponse({ mensaje: 'Fallo interno.' }, 500), NOW);
  assert.equal(result.fallbackReason, bothFailed('La API respondió con error HTTP 500: Fallo interno.'));
});

test('un 500 sin mensaje usa el statusText si existe', async () => {
  const response = new Response('{}', { status: 500, statusText: 'Internal Server Error' });
  const result = await fetchArrivals(STOP, async () => response, NOW);
  assert.equal(result.fallbackReason, bothFailed('La API respondió con error HTTP 500: Internal Server Error.'));
});

const PROXY_SOURCE_URL = arrivalsProxyUrl(STOP.number);
const PARQUE_GOYA_ROW = { linea: '35', destino: 'PARQUE GOYA.', primero: '4 minutos.', segundo: '16 minutos.' };

/** Fetch falso que responde según la URL y registra las peticiones. */
function routedFetch(routes: Record<string, () => Response>, urls: string[]): FetchFunction {
  return async (url) => {
    urls.push(url);
    return routes[url]();
  };
}

test('proxy correcto devuelve live sin llamar a la API municipal', async () => {
  const urls: string[] = [];
  const fetchFn = routedFetch({ [PROXY_SOURCE_URL]: () => jsonResponse({ destinos: [PARQUE_GOYA_ROW] }) }, urls);
  const result = await fetchArrivals(STOP, fetchFn, NOW);
  assert.equal(result.source, 'live');
  assert.equal(result.data.length, 1);
  assert.deepEqual(urls, [PROXY_SOURCE_URL]);
});

test('la URL del proxy usa el número del poste', async () => {
  assert.equal(PROXY_SOURCE_URL, '/es/zaragoza-bus/api/poste/104');
  assert.equal(arrivalsProxyUrl('a/b'), '/es/zaragoza-bus/api/poste/a%2Fb');
});

test('proxy 502 con {error} y API municipal correcta devuelve live', async () => {
  const urls: string[] = [];
  const fetchFn = routedFetch(
    {
      [PROXY_SOURCE_URL]: () => jsonResponse({ error: 'upstream caído' }, 502),
      [arrivalsUrl(STOP.id)]: () => jsonResponse({ destinos: [PARQUE_GOYA_ROW] }),
    },
    urls,
  );
  const result = await fetchArrivals(STOP, fetchFn, NOW);
  assert.equal(result.source, 'live');
  assert.equal(result.fallbackReason, undefined);
  assert.deepEqual(urls, [PROXY_SOURCE_URL, arrivalsUrl(STOP.id)]);
});

test('si fallan proxy y API municipal, demo con el motivo de ambos', async () => {
  const fetchFn = routedFetch(
    {
      [PROXY_SOURCE_URL]: () => jsonResponse({ error: 'upstream caído' }, 502),
      [arrivalsUrl(STOP.id)]: () => jsonResponse({ status: 400, mensaje: 'NoHttpResponseException' }, 400),
    },
    [],
  );
  const result = await fetchArrivals(STOP, fetchFn, NOW);
  assert.equal(result.source, 'demo');
  assert.deepEqual(result.data, demoArrivals(STOP, NOW));
  assert.equal(
    result.fallbackReason,
    'Proxy: La API respondió con error HTTP 502: upstream caído. ' +
      'API municipal: La API respondió con error HTTP 400: NoHttpResponseException.',
  );
});

test('proxy con destinos vacíos es live con lista vacía y no prueba la siguiente fuente', async () => {
  const urls: string[] = [];
  const fetchFn = routedFetch({ [PROXY_SOURCE_URL]: () => jsonResponse({ destinos: [] }) }, urls);
  const result = await fetchArrivals(STOP, fetchFn, NOW);
  assert.equal(result.source, 'live');
  assert.deepEqual(result.data, []);
  assert.deepEqual(urls, [PROXY_SOURCE_URL]);
});

test('filas del proxy de la misma línea y destino se agrupan en un solo Arrival', async () => {
  const rows = [
    { linea: '35', destino: 'PARQUE GOYA.', primero: '9 minutos.', segundo: null },
    { linea: '35', destino: 'PARQUE GOYA.', primero: '3 minutos.', segundo: null },
  ];
  const result = await fetchArrivals(STOP, async () => jsonResponse({ destinos: rows }), NOW);
  assert.equal(result.source, 'live');
  assert.deepEqual(result.data, [{ line: '35', destination: 'Parque Goya', firstMinutes: 3, secondMinutes: 9 }]);
});
