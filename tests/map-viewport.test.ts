import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAP_FIT_MARGIN_PX, NO_PANEL_COVER, computeFitPadding, hasUsableSpace } from '../components/map-viewport';

const DESKTOP_PANEL_RIGHT = 436;
const MOBILE_SHEET_HEIGHT = 440;

test('computeFitPadding sin panel deja solo el margen', () => {
  assert.deepEqual(computeFitPadding(NO_PANEL_COVER), {
    topLeft: [MAP_FIT_MARGIN_PX, MAP_FIT_MARGIN_PX],
    bottomRight: [MAP_FIT_MARGIN_PX, MAP_FIT_MARGIN_PX],
  });
});

test('computeFitPadding en escritorio reserva el ancho del panel a la izquierda', () => {
  const padding = computeFitPadding({ left: DESKTOP_PANEL_RIGHT, bottom: 0 });
  assert.deepEqual(padding.topLeft, [DESKTOP_PANEL_RIGHT + MAP_FIT_MARGIN_PX, MAP_FIT_MARGIN_PX]);
  assert.deepEqual(padding.bottomRight, [MAP_FIT_MARGIN_PX, MAP_FIT_MARGIN_PX]);
});

test('computeFitPadding en móvil reserva la altura de la hoja por abajo', () => {
  const padding = computeFitPadding({ left: 0, bottom: MOBILE_SHEET_HEIGHT });
  assert.deepEqual(padding.topLeft, [MAP_FIT_MARGIN_PX, MAP_FIT_MARGIN_PX]);
  assert.deepEqual(padding.bottomRight, [MAP_FIT_MARGIN_PX, MOBILE_SHEET_HEIGHT + MAP_FIT_MARGIN_PX]);
});

test('hasUsableSpace detecta cuándo el relleno se come todo el mapa', () => {
  const padding = computeFitPadding({ left: DESKTOP_PANEL_RIGHT, bottom: 0 });
  assert.equal(hasUsableSpace({ x: 1280, y: 800 }, padding), true);
  assert.equal(hasUsableSpace({ x: DESKTOP_PANEL_RIGHT, y: 800 }, padding), false);
  assert.equal(hasUsableSpace({ x: 0, y: 0 }, computeFitPadding(NO_PANEL_COVER)), false);
});
