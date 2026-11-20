import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VehiclesFormatError, fetchStopVehicles, parseStopVehicles } from '../lib/bus-vehicles';
import { describeFailure } from '../lib/bus-source';
import type { FetchFunction } from '../lib/bus-source';
import { vehiclesProxyUrl } from '../lib/config';

const STOP_NUMBER = '104';

function validBus(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    coche: '4709',
    linea: '58',
    destino: 'FUENTE JUNQUERA',
    latitud: 41.6269,
    longitud: -0.9073,
    llegadas: [{ minutos: 21, km: 4 }, { minutos: 51, km: 10 }],
    ...overrides,
  };
}

function validBody(): unknown {
  return { poste: { latitud: 41.627026, longitud: -0.907306 }, autobuses: [validBus()] };
}

function assertFormatError(json: unknown, message: RegExp): void {
  assert.throws(() => parseStopVehicles(json), (error) => {
    assert.ok(error instanceof VehiclesFormatError);
    assert.match(error.message, message);
    return true;
  });
}

test('parseStopVehicles convierte un caso válido', () => {
  assert.deepEqual(parseStopVehicles(validBody()), {
    stopPosition: { latitude: 41.627026, longitude: -0.907306 },
    vehicles: [
      {
        vehicle: '4709',
        line: '58',
        destination: 'FUENTE JUNQUERA',
        position: { latitude: 41.6269, longitude: -0.9073 },
        arrivals: [{ minutes: 21, km: 4 }, { minutes: 51, km: 10 }],
      },
    ],
  });
});

test('parseStopVehicles admite poste null y ausencia de autobuses', () => {
  assert.deepEqual(parseStopVehicles({ poste: null, autobuses: [] }), { stopPosition: null, vehicles: [] });
});

test('parseStopVehicles admite poste ausente y llegadas vacías', () => {
  const result = parseStopVehicles({ autobuses: [validBus({ llegadas: [] })] });
  assert.equal(result.stopPosition, null);
  assert.deepEqual(result.vehicles[0].arrivals, []);
});

test('parseStopVehicles rechaza lo que no es un objeto', () => {
  assertFormatError(null, /no es un objeto/);
  assertFormatError([], /no es un objeto/);
  assertFormatError('texto', /no es un objeto/);
});

test('parseStopVehicles rechaza autobuses que no es lista', () => {
  assertFormatError({ poste: null }, /"autobuses"/);
  assertFormatError({ poste: null, autobuses: {} }, /"autobuses"/);
});

test('parseStopVehicles rechaza un autobús que no es objeto', () => {
  assertFormatError({ autobuses: [7] }, /autobús 0 no es un objeto/);
});

test('parseStopVehicles rechaza autobús sin coche o sin línea', () => {
  assertFormatError({ autobuses: [validBus({ coche: undefined })] }, /"coche"/);
  assertFormatError({ autobuses: [validBus({ linea: '' })] }, /"linea"/);
});

test('parseStopVehicles rechaza coordenadas ausentes o no finitas', () => {
  assertFormatError({ autobuses: [validBus({ latitud: undefined })] }, /latitud/);
  assertFormatError({ autobuses: [validBus({ longitud: '1' })] }, /longitud/);
  assertFormatError({ autobuses: [validBus({ latitud: Number.NaN })] }, /latitud/);
  assertFormatError({ autobuses: [validBus({ longitud: Number.POSITIVE_INFINITY })] }, /longitud/);
});

test('parseStopVehicles rechaza poste con coordenadas inválidas', () => {
  assertFormatError({ poste: { latitud: 1 }, autobuses: [] }, /"poste"/);
});

test('parseStopVehicles rechaza llegadas inválidas', () => {
  assertFormatError({ autobuses: [validBus({ llegadas: undefined })] }, /"llegadas"/);
  assertFormatError({ autobuses: [validBus({ llegadas: [3] })] }, /llegada/);
  assertFormatError({ autobuses: [validBus({ llegadas: [{ minutos: 'x', km: 1 }] })] }, /llegada/);
  assertFormatError({ autobuses: [validBus({ llegadas: [{ minutos: 1, km: Number.NaN }] })] }, /llegada/);
});

test('el mensaje indica el índice del autobús defectuoso', () => {
  assertFormatError({ autobuses: [validBus(), validBus({ coche: 5 })] }, /autobús 1 /);
});

test('fetchStopVehicles pide la URL del proxy y devuelve los autobuses', async () => {
  const urls: string[] = [];
  const fetchFn: FetchFunction = async (url) => {
    urls.push(url);
    return new Response(JSON.stringify(validBody()), { status: 200 });
  };
  const result = await fetchStopVehicles(STOP_NUMBER, fetchFn);
  assert.deepEqual(urls, ['/es/zaragoza-bus/api/gps/104']);
  assert.equal(urls[0], vehiclesProxyUrl(STOP_NUMBER));
  assert.equal(result.vehicles.length, 1);
});

test('fetchStopVehicles lanza con el detalle ante HTTP 502 con {error}', async () => {
  const fetchFn: FetchFunction = async () =>
    new Response(JSON.stringify({ error: 'Origen no disponible.' }), { status: 502 });
  await assert.rejects(fetchStopVehicles(STOP_NUMBER, fetchFn), (error) => {
    assert.match(describeFailure(error), /error HTTP 502: Origen no disponible/);
    return true;
  });
});

test('fetchStopVehicles lanza VehiclesFormatError ante un cuerpo con formato roto', async () => {
  const fetchFn: FetchFunction = async () => new Response(JSON.stringify({ poste: null }), { status: 200 });
  await assert.rejects(fetchStopVehicles(STOP_NUMBER, fetchFn), (error) => {
    assert.ok(error instanceof VehiclesFormatError);
    assert.match(describeFailure(error), /formato inesperado/);
    return true;
  });
});
