import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  LINE_FIT_MARGIN_PX,
  LINE_PILL_TOP_OFFSET_PX,
  lineFitPadding,
  lineStatusText,
  shouldCloseStopForLine,
} from '../lib/line-selection';
import type { BusStop } from '../lib/types';

const PILL_HEIGHT = 52;
const SHEET_HEIGHT = 228;
const PANEL_RIGHT = 436;
const EXPECTED_TOP = LINE_PILL_TOP_OFFSET_PX + PILL_HEIGHT + LINE_FIT_MARGIN_PX;

function stopWithLines(lines: string[]): BusStop {
  return { id: 'x', number: '1', name: 'Parada', coordinates: { latitude: 41.6, longitude: -0.9 }, lines };
}

test('shouldCloseStopForLine: sin parada no cierra nada', () => {
  assert.equal(shouldCloseStopForLine(null, '25'), false);
});

test('shouldCloseStopForLine: cierra si la parada no tiene la línea', () => {
  assert.equal(shouldCloseStopForLine(stopWithLines(['21', 'N1']), '25'), true);
});

test('shouldCloseStopForLine: se queda si la tiene, sin distinguir mayúsculas ni ceros', () => {
  assert.equal(shouldCloseStopForLine(stopWithLines(['CI2']), 'Ci2'), false);
  assert.equal(shouldCloseStopForLine(stopWithLines(['058']), '58'), false);
});

test('lineFitPadding en móvil reserva la píldora arriba y la hoja abajo', () => {
  const padding = lineFitPadding({ isMobile: true, sheetHeightPx: SHEET_HEIGHT, panelRightPx: 0, pillHeightPx: PILL_HEIGHT });
  assert.deepEqual(padding.topLeft, [LINE_FIT_MARGIN_PX, EXPECTED_TOP]);
  assert.deepEqual(padding.bottomRight, [LINE_FIT_MARGIN_PX, SHEET_HEIGHT + LINE_FIT_MARGIN_PX]);
});

test('lineFitPadding en escritorio reserva el panel a la izquierda y la píldora arriba', () => {
  const padding = lineFitPadding({ isMobile: false, sheetHeightPx: 0, panelRightPx: PANEL_RIGHT, pillHeightPx: PILL_HEIGHT });
  assert.deepEqual(padding.topLeft, [PANEL_RIGHT + LINE_FIT_MARGIN_PX, EXPECTED_TOP]);
  assert.deepEqual(padding.bottomRight, [LINE_FIT_MARGIN_PX, LINE_FIT_MARGIN_PX]);
});

test('lineStatusText cubre carga, contador, singular, vacío y fallo', () => {
  assert.equal(lineStatusText({ vehicles: 0, complete: false, failed: false }), 'Cargando autobuses…');
  assert.equal(lineStatusText({ vehicles: 4, complete: false, failed: false }), 'Cargando autobuses… 4');
  assert.equal(lineStatusText({ vehicles: 9, complete: true, failed: false }), '9 autobuses');
  assert.equal(lineStatusText({ vehicles: 1, complete: true, failed: false }), '1 autobús');
  assert.equal(lineStatusText({ vehicles: 0, complete: true, failed: false }), 'Sin autobuses ahora');
  assert.equal(lineStatusText({ vehicles: 0, complete: true, failed: true }), 'Autobuses no disponibles');
});
