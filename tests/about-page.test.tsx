import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SobreElServicioPage, { metadata } from '../app/sobre-el-servicio/page';
import sitemap from '../app/sitemap';
import PanelFooter from '../components/PanelFooter';
import { absoluteUrl } from '../lib/site';

test('la página «Sobre este servicio» está en el sitemap y el panel enlaza a ella', () => {
  const urls = sitemap().map((entry) => entry.url);
  assert.ok(urls.includes(absoluteUrl('/sobre-el-servicio')));
  assert.ok(renderToStaticMarkup(<PanelFooter />).includes('href="/sobre-el-servicio"'));
});

test('la página «Sobre este servicio» muestra el texto, se indexa y declara canonical', () => {
  const html = renderToStaticMarkup(<SobreElServicioPage />);
  assert.ok(html.includes('<h1'));
  assert.ok(html.includes('datos abiertos del Ayuntamiento de Zaragoza'));
  assert.equal(metadata.title, 'Sobre este servicio');
  assert.equal(metadata.robots, undefined);
  assert.equal(metadata.alternates?.canonical, absoluteUrl('/sobre-el-servicio'));
});
