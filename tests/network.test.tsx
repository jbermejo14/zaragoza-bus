import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getNetworkSections, NETWORK_ENV_VAR } from '../lib/network';
import { NetworkFooterLinks } from '../components/NetworkLinks';

const NETWORK_TEST_OWN_ROUTE = '/es/zaragoza-bus';
const NETWORK_TEST_DIR = mkdtempSync(join(tmpdir(), 'red-enlaces-'));
const networkTestPreviousValue = process.env[NETWORK_ENV_VAR];
let networkTestCounter = 0;

const NETWORK_TEST_DATA = {
  version: 1,
  generado: '2026-11-19T00:00:00.000Z',
  secciones: [
    { ruta: NETWORK_TEST_OWN_ROUTE, nombre: 'Propia', descripcion: 'Esta web' },
    { ruta: '/es/gasolineras', nombre: 'Gasolineras', descripcion: 'Precios' },
    { ruta: '/es/zbe', nombre: 'Zonas de bajas emisiones', descripcion: 'Mapa' }
  ],
  enlaces: {}
};

// Un fichero distinto por prueba: el módulo cachea por ruta.
function networkTestUse(content: string): void {
  networkTestCounter += 1;
  const file = join(NETWORK_TEST_DIR, `red-${networkTestCounter}.json`);
  writeFileSync(file, content);
  process.env[NETWORK_ENV_VAR] = file;
}

afterEach(() => {
  if (networkTestPreviousValue === undefined) delete process.env[NETWORK_ENV_VAR];
  else process.env[NETWORK_ENV_VAR] = networkTestPreviousValue;
});

test('sin variable de entorno no hay red y no falla', () => {
  delete process.env[NETWORK_ENV_VAR];
  assert.equal(getNetworkSections(NETWORK_TEST_OWN_ROUTE), null);
});

test('con un fichero inexistente no hay red y no falla', () => {
  process.env[NETWORK_ENV_VAR] = join(NETWORK_TEST_DIR, 'no-existe.json');
  assert.equal(getNetworkSections(NETWORK_TEST_OWN_ROUTE), null);
});

test('JSON roto: error claro en español con la ruta del fichero', () => {
  networkTestUse('{ esto no es json');
  assert.throws(() => getNetworkSections(NETWORK_TEST_OWN_ROUTE), /no es válido/);
});

test('versión distinta de 1: error claro', () => {
  networkTestUse(JSON.stringify({ ...NETWORK_TEST_DATA, version: 2 }));
  assert.throws(() => getNetworkSections(NETWORK_TEST_OWN_ROUTE), /versión de red de enlaces no soportada/);
});

test('las secciones excluyen la propia', () => {
  networkTestUse(JSON.stringify(NETWORK_TEST_DATA));
  const sections = getNetworkSections(NETWORK_TEST_OWN_ROUTE);
  assert.deepEqual(sections?.map(section => section.ruta), ['/es/gasolineras', '/es/zbe']);
});

test('NetworkFooterLinks pinta las demás secciones con <a>; nada si no hay red', () => {
  networkTestUse(JSON.stringify(NETWORK_TEST_DATA));
  const html = renderToStaticMarkup(<NetworkFooterLinks />);
  assert.ok(html.includes('Otras webs de Ododex'));
  assert.ok(html.includes('href="/es/zbe"'));
  assert.ok(!html.includes('Propia'));
  delete process.env[NETWORK_ENV_VAR];
  assert.equal(renderToStaticMarkup(<NetworkFooterLinks />), '');
});
