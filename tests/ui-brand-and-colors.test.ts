import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SITE_NAME } from '../lib/site';

const SOURCE_DIRECTORIES = ['app', 'components', 'lib'];
// Términos de otras webs de la red y restos de plantilla, que no deben aparecer aquí.
const FORBIDDEN_TERMS = ['electrico-vs-gasolina', 'Eléctrico vs gasolina', 'coste por km', 'AutoTax', 'es-itv', 'AdSlot', 'AdSense', 'ododex-theme', 'data-theme'];
// La paleta roja de ZaraBus llega por tokens de app/globals.css (bg-accent, text-muted...):
// en los .tsx no se admiten hex, degradados ni colores de la paleta fija de Tailwind.
const FIXED_COLOR_PATTERN =
  /#[0-9a-fA-F]{3,8}\b|gradient|(text|bg|border)-(slate|zinc|orange|gray|neutral|stone|red|green|blue|amber|emerald)-\d/;
const GLOBALS_CSS = path.join('app', 'globals.css');
const REQUIRED_TOKENS = ['--color-accent', '--color-accent-hover', '--color-surface', '--color-card', '--color-line', '--color-ink', '--color-muted'];

function uiListFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? uiListFiles(fullPath) : [fullPath];
  });
}

function uiSourceFiles(directories: string[]): string[] {
  return directories.flatMap(directory => uiListFiles(path.join(process.cwd(), directory)));
}

function uiRead(...segments: string[]): string {
  return readFileSync(path.join(process.cwd(), ...segments), 'utf-8');
}

test('marca: SITE_NAME es Ododex', () => {
  assert.equal(SITE_NAME, 'Ododex');
});

test('marca: ningún fichero de app, components ni lib usa términos heredados', () => {
  const offenders = uiSourceFiles(SOURCE_DIRECTORIES)
    .filter(file => /\.tsx?$/.test(file))
    .filter(file => FORBIDDEN_TERMS.some(term => readFileSync(file, 'utf-8').includes(term)))
    .map(file => path.relative(process.cwd(), file));
  assert.deepEqual(offenders, []);
});

test('colores: ningún .tsx de app ni components usa colores sueltos, degradados ni paleta fija', () => {
  const offenders = uiSourceFiles(['app', 'components'])
    .filter(file => file.endsWith('.tsx'))
    .filter(file => FIXED_COLOR_PATTERN.test(readFileSync(file, 'utf-8')))
    .map(file => path.relative(process.cwd(), file));
  assert.deepEqual(offenders, []);
});

test('colores: globals.css define los tokens de la paleta roja', () => {
  const css = uiRead(GLOBALS_CSS);
  for (const token of REQUIRED_TOKENS) assert.ok(css.includes(`${token}:`), `Falta ${token}`);
});

test('solo modo claro: sin tema oscuro en el CSS ni botón de tema en la cabecera', () => {
  const css = uiRead(GLOBALS_CSS);
  assert.ok(!css.includes('data-theme'));
  assert.ok(!css.includes('prefers-color-scheme'));
  assert.ok(!/theme/i.test(uiRead('components', 'Header.tsx')));
});

test('leaflet: su CSS va en la capa base para que las utilidades de Tailwind ganen', () => {
  const css = uiRead(GLOBALS_CSS);
  assert.ok(css.includes('@import "leaflet/dist/leaflet.css" layer(base);'));
  assert.ok(css.includes('@import "leaflet.markercluster/dist/MarkerCluster.css" layer(base);'));
  assert.ok(!uiRead('app', 'layout.tsx').includes('leaflet'), 'layout.tsx no debe importar el CSS de Leaflet fuera de capa');
});
