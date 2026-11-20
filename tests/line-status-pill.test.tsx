import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LineStatusPill from '../components/LineStatusPill';

const NOOP = () => undefined;

test('LineStatusPill no pinta nada sin línea', () => {
  assert.equal(renderToStaticMarkup(<LineStatusPill line={null} vehicles={3} complete failed={false} onClear={NOOP} />), '');
});

test('LineStatusPill cargando: spinner, texto con contador y zona aria-live', () => {
  const html = renderToStaticMarkup(<LineStatusPill line="Ci2" vehicles={4} complete={false} failed={false} onClear={NOOP} />);
  assert.ok(html.includes('Cargando autobuses… 4'));
  assert.ok(html.includes('animate-spin'));
  assert.ok(html.includes('aria-live="polite"'));
});

test('LineStatusPill terminada: contador en grande y sin spinner', () => {
  const html = renderToStaticMarkup(<LineStatusPill line="25" vehicles={9} complete failed={false} onClear={NOOP} />);
  assert.ok(html.includes('9 autobuses'));
  assert.ok(html.includes('font-bold'));
  assert.ok(!html.includes('animate-spin'));
});

test('LineStatusPill con fallo avisa de que no hay autobuses disponibles', () => {
  const html = renderToStaticMarkup(<LineStatusPill line="25" vehicles={0} complete failed onClear={NOOP} />);
  assert.ok(html.includes('Autobuses no disponibles'));
});

test('LineStatusPill ofrece quitar la línea con un botón accesible', () => {
  const html = renderToStaticMarkup(<LineStatusPill line="Ci2" vehicles={0} complete failed={false} onClear={NOOP} />);
  assert.ok(html.includes('aria-label="Quitar la línea Ci2"'));
});
