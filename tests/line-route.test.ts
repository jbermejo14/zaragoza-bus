import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeFailure } from '../lib/bus-source';
import type { FetchFunction } from '../lib/bus-source';
import { lineRouteUrl } from '../lib/config';
import { RouteFormatError, fetchLineRoute, parseLineRoute } from '../lib/line-route';

const MULTI = (coordinates: unknown) => ({ geometry: { type: 'MultiLineString', coordinates } });

const TWO_WAYS = {
  title: 'Transporte Urbano. Línea 24',
  result: [
    MULTI([[[-0.86, 41.65], [-0.859, 41.651]]]),
    MULTI([[[-0.871, 41.64], [-0.8705, 41.6402], [-0.87, 41.641]]]),
    { title: 'Parada', geometry: { type: 'Point', coordinates: [-0.86, 41.65] } },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test('MultiLineString con dos sentidos: dos tramos, [lon, lat] a latitude/longitude, Points ignorados', () => {
  const route = parseLineRoute('24', TWO_WAYS);
  assert.equal(route.line, '24');
  assert.equal(route.paths.length, 2);
  assert.deepEqual(route.paths[0][0], { latitude: 41.65, longitude: -0.86 });
  assert.equal(route.paths[1].length, 3);
});

test('LineString es un único tramo', () => {
  const json = { result: [{ geometry: { type: 'LineString', coordinates: [[-0.86, 41.65], [-0.85, 41.66]] } }] };
  assert.equal(parseLineRoute('Ci1', json).paths.length, 1);
});

test('descarta puntos con coordenadas inválidas', () => {
  const json = { result: [MULTI([[[-0.86, 41.65], ['x', 41], [null, 1], [-0.85, Infinity], [-0.85, 41.66]]])] };
  assert.equal(parseLineRoute('24', json).paths[0].length, 2);
});

test('descarta tramos con menos de 2 puntos pero conserva el resto', () => {
  const json = { result: [MULTI([[[-0.86, 41.65]], [[-0.86, 41.65], [-0.85, 41.66]]])] };
  assert.equal(parseLineRoute('24', json).paths.length, 1);
});

test('sin tramos, sin result o json no objeto: RouteFormatError', () => {
  const onlyPoints = { result: [{ geometry: { type: 'Point', coordinates: [-0.86, 41.65] } }] };
  for (const json of [onlyPoints, { result: [] }, { result: 'x' }, {}, null, 'texto', 5]) {
    assert.throws(() => parseLineRoute('24', json), RouteFormatError);
  }
});

test('fetchLineRoute pide lineRouteUrl con codificación para Ci1', async () => {
  const urls: string[] = [];
  const fetchFn: FetchFunction = async (url) => {
    urls.push(url);
    return jsonResponse(TWO_WAYS);
  };
  const route = await fetchLineRoute('Ci1', fetchFn);
  assert.deepEqual(urls, [lineRouteUrl('Ci1')]);
  assert.equal(route.paths.length, 2);
});

test('HTTP 404 lanza con mensaje HTTP', async () => {
  const fetchFn: FetchFunction = async () => jsonResponse({ mensaje: 'No existe.' }, 404);
  await assert.rejects(fetchLineRoute('99', fetchFn), (error) => {
    assert.equal(describeFailure(error), 'La API respondió con error HTTP 404: No existe.');
    return true;
  });
});

test('timeout (AbortError) lanza y describeFailure da el mensaje de 8 s', async () => {
  const fetchFn: FetchFunction = async () => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    throw error;
  };
  await assert.rejects(fetchLineRoute('24', fetchFn), (error) => {
    assert.equal(describeFailure(error), 'La API no respondió en 8 s.');
    return true;
  });
});

test('describeFailure clasifica RouteFormatError como formato inesperado', async () => {
  const fetchFn: FetchFunction = async () => jsonResponse({ result: [] });
  await assert.rejects(fetchLineRoute('24', fetchFn), (error) => {
    assert.match(describeFailure(error), /^La API devolvió un formato inesperado: /);
    return true;
  });
});
