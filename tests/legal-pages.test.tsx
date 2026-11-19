import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AvisoLegalPage, { metadata as avisoMetadata } from '../app/aviso-legal/page';
import PrivacidadPage, { metadata as privacidadMetadata } from '../app/privacidad/page';
import CookiesPage, { metadata as cookiesMetadata } from '../app/cookies/page';
import { Footer } from '../components/Footer';
import { getTitular, valorOPendiente } from '../lib/legal';

const LEGAL_ROBOTS = { index: false, follow: true };
const LEGAL_INHERITED_TERMS = ['MITECO', 'IEDMT', 'ITV', 'Real Decreto 920/2017', 'BOE', 'gasolina', 'AdSense', 'ododex-theme', 'Configurar cookies'];

test('aviso legal: muestra el titular o el marcador, las fuentes y no se indexa', () => {
  const html = renderToStaticMarkup(<AvisoLegalPage />);
  assert.ok(html.includes(valorOPendiente(getTitular(), 'nombre')));
  assert.ok(html.includes('LSSI'));
  assert.ok(html.includes('Avanza'));
  assert.ok(html.includes('DNDzgz'));
  assert.ok(html.includes('ODbL 1.0'));
  assert.ok(html.includes('https://www.openstreetmap.org/copyright'));
  assert.deepEqual(avisoMetadata.robots, LEGAL_ROBOTS);
});

test('privacidad: titular, AEPD, favoritos locales, proxy de Ododex y geolocalización local', () => {
  const html = renderToStaticMarkup(<PrivacidadPage />);
  assert.ok(html.includes(valorOPendiente(getTitular(), 'nombre')));
  assert.ok(html.includes('AEPD'));
  assert.ok(html.includes('zarabus:favorites'));
  assert.ok(html.includes('servidor de Ododex'));
  assert.ok(html.includes('no se envía ni se guarda'));
  assert.ok(html.includes('OpenStreetMap'));
  assert.deepEqual(privacidadMetadata.robots, LEGAL_ROBOTS);
});

test('cookies: documenta zarabus:favorites y declara que no hay cookies de terceros', () => {
  const html = renderToStaticMarkup(<CookiesPage />);
  assert.ok(html.includes('zarabus:favorites'));
  assert.ok(html.includes('no usa cookies de terceros'));
  assert.ok(html.includes('OpenStreetMap'));
  assert.deepEqual(cookiesMetadata.robots, LEGAL_ROBOTS);
});

test('legales y pie: no heredan términos de otras webs de la red ni mencionan publicidad de terceros', () => {
  const pages = [<AvisoLegalPage />, <PrivacidadPage />, <CookiesPage />, <Footer />];
  for (const page of pages) {
    const html = renderToStaticMarkup(page);
    for (const term of LEGAL_INHERITED_TERMS) assert.ok(!html.includes(term), `aparece ${term}`);
  }
});

test('layout: no fija robots global (cada página pone el suyo)', () => {
  const layout = readFileSync(path.join(process.cwd(), 'app', 'layout.tsx'), 'utf-8');
  assert.ok(!layout.includes('robots'));
});

test('Footer: enlaces legales a las tres páginas', () => {
  const html = renderToStaticMarkup(<Footer />);
  for (const ruta of ['/aviso-legal', '/privacidad', '/cookies']) {
    assert.ok(html.includes(`href="${ruta}"`), `Falta ${ruta}`);
  }
});

test('Footer: atribución de OpenStreetMap, fuentes y carácter independiente', () => {
  const html = renderToStaticMarkup(<Footer />);
  assert.ok(html.includes('href="https://www.openstreetmap.org/copyright"'));
  assert.ok(html.includes('ODbL'));
  assert.ok(html.includes('Ayuntamiento de Zaragoza'));
  assert.ok(html.includes('Avanza'));
  assert.ok(html.includes('DNDzgz'));
  assert.ok(html.includes('no es una web del Ayuntamiento de Zaragoza ni de Avanza'));
});
