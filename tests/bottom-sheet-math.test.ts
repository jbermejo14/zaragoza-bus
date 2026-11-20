import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SHEET_COLLAPSED_RATIO,
  SHEET_EXPANDED_RATIO,
  SHEET_HALF_RATIO,
  clampSheetHeight,
  higherSheetAnchor,
  nearestSheetAnchor,
  nextSheetAnchor,
  parseSheetHeightPx,
  sheetAnchorHeight,
} from '../lib/bottom-sheet-math';

const VIEWPORT = 1000;

test('las tres alturas están ordenadas y caben en la ventana', () => {
  assert.ok(SHEET_COLLAPSED_RATIO < SHEET_HALF_RATIO);
  assert.ok(SHEET_HALF_RATIO < SHEET_EXPANDED_RATIO);
  assert.ok(SHEET_EXPANDED_RATIO < 1);
});

test('sheetAnchorHeight convierte la fracción en píxeles', () => {
  assert.equal(sheetAnchorHeight('collapsed', VIEWPORT), VIEWPORT * SHEET_COLLAPSED_RATIO);
  assert.equal(sheetAnchorHeight('half', VIEWPORT), VIEWPORT * SHEET_HALF_RATIO);
  assert.equal(sheetAnchorHeight('expanded', VIEWPORT), VIEWPORT * SHEET_EXPANDED_RATIO);
});

test('clampSheetHeight limita el arrastre entre la altura mínima y la máxima', () => {
  assert.equal(clampSheetHeight(0, VIEWPORT), sheetAnchorHeight('collapsed', VIEWPORT));
  assert.equal(clampSheetHeight(VIEWPORT, VIEWPORT), sheetAnchorHeight('expanded', VIEWPORT));
  assert.equal(clampSheetHeight(500, VIEWPORT), 500);
});

test('nearestSheetAnchor elige la posición más cercana a la altura soltada', () => {
  assert.equal(nearestSheetAnchor(300, VIEWPORT), 'collapsed');
  assert.equal(nearestSheetAnchor(500, VIEWPORT), 'half');
  assert.equal(nearestSheetAnchor(800, VIEWPORT), 'expanded');
  assert.equal(nearestSheetAnchor(sheetAnchorHeight('half', VIEWPORT), VIEWPORT), 'half');
});

test('nextSheetAnchor sube de una altura a la siguiente y vuelve a la recogida', () => {
  assert.equal(nextSheetAnchor('collapsed'), 'half');
  assert.equal(nextSheetAnchor('half'), 'expanded');
  assert.equal(nextSheetAnchor('expanded'), 'collapsed');
});

test('higherSheetAnchor devuelve la posición más alta', () => {
  assert.equal(higherSheetAnchor('collapsed', 'half'), 'half');
  assert.equal(higherSheetAnchor('expanded', 'half'), 'expanded');
  assert.equal(higherSheetAnchor('half', 'half'), 'half');
});

test('parseSheetHeightPx convierte dvh y px a píxeles y rechaza otros formatos', () => {
  assert.equal(parseSheetHeightPx('55dvh', 800), 440);
  assert.equal(parseSheetHeightPx(' 28dvh ', 1000), 280);
  assert.equal(parseSheetHeightPx('312.5px', 800), 312.5);
  assert.equal(parseSheetHeightPx('', 800), null);
  assert.equal(parseSheetHeightPx('auto', 800), null);
  assert.equal(parseSheetHeightPx('40%', 800), null);
});
