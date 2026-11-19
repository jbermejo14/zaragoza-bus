import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickRouteLine, toggleHighlightedLine } from '../lib/route-line';

test('pickRouteLine prioriza el filtro y cae a la insignia pulsada', () => {
  assert.equal(pickRouteLine('24', '35'), '24');
  assert.equal(pickRouteLine(null, '35'), '35');
  assert.equal(pickRouteLine(null, null), null);
});

test('toggleHighlightedLine activa, cambia y quita', () => {
  assert.equal(toggleHighlightedLine(null, '24'), '24');
  assert.equal(toggleHighlightedLine('24', '35'), '35');
  assert.equal(toggleHighlightedLine('24', '24'), null);
});
