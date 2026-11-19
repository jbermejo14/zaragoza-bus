import { test } from 'node:test';
import assert from 'node:assert/strict';

// Comprueba que la infraestructura de pruebas (cargador TypeScript) funciona.
test('la infraestructura de pruebas ejecuta TypeScript', () => {
  const value: number = 1 + 1;
  assert.equal(value, 2);
});
