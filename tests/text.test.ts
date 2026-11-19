import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText } from '../lib/text';

test('normaliza un nombre de poste con puntos y ordinal', () => {
  assert.equal(normalizeText('P. Independencia N.º 25'), 'p independencia n o 25');
});

test('quita tildes, guiones largos y espacios sobrantes', () => {
  assert.equal(normalizeText('  Delicias–Ávila '), 'delicias avila');
});

test('convierte ñ en n y quita diéresis', () => {
  assert.equal(normalizeText('Pañuelo Pingüino'), 'panuelo pinguino');
});

test('cadena vacía o solo símbolos da cadena vacía', () => {
  assert.equal(normalizeText(''), '');
  assert.equal(normalizeText(' .,- '), '');
});

test('conserva dígitos y colapsa separadores', () => {
  assert.equal(normalizeText('Línea   Ci1'), 'linea ci1');
});
