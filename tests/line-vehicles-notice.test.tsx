import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LineVehiclesNotice, { lineVehiclesNoticeText } from '../components/LineVehiclesNotice';

test('aviso de autobuses de la línea: plural, singular y ninguno', () => {
  assert.equal(lineVehiclesNoticeText('25', 6), '6 autobuses de la línea 25 en servicio ahora');
  assert.equal(lineVehiclesNoticeText('25', 1), '1 autobús de la línea 25 en servicio ahora');
  assert.equal(lineVehiclesNoticeText('25', 0), 'No hay autobuses de la línea 25 en servicio ahora');
});

test('LineVehiclesNotice no pinta nada sin línea o sin dato (cargando o fallo)', () => {
  assert.equal(renderToStaticMarkup(<LineVehiclesNotice line={null} count={3} />), '');
  assert.equal(renderToStaticMarkup(<LineVehiclesNotice line="25" count={null} />), '');
});

test('LineVehiclesNotice muestra el recuento con una línea y datos', () => {
  const html = renderToStaticMarkup(<LineVehiclesNotice line="25" count={4} />);
  assert.ok(html.includes('4 autobuses de la línea 25 en servicio ahora'));
});
