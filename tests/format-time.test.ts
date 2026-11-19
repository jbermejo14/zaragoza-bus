import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatClock, formatMinutes } from '../lib/format-time';

test('formatMinutes cubre llegando, minutos y sin estimación', () => {
  assert.equal(formatMinutes(0), 'Llegando');
  assert.equal(formatMinutes(7), '7 min');
  assert.equal(formatMinutes(null), '—');
});

test('formatClock rellena con ceros', () => {
  assert.equal(formatClock(new Date(2026, 10, 19, 9, 5, 3)), '09:05:03');
  assert.equal(formatClock(new Date(2026, 10, 19, 23, 59, 59)), '23:59:59');
});
