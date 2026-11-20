import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SITE_NAME } from '../lib/site';
import { THEME_INIT_SCRIPT } from '../lib/theme';

const SOURCE_DIRECTORIES = ['app', 'components', 'lib'];
// Términos de otras webs de la red y restos de plantilla, que no deben aparecer aquí.
const FORBIDDEN_TERMS = ['electrico-vs-gasolina', 'Eléctrico vs gasolina', 'coste por km', 'AutoTax', 'es-itv', 'AdSlot', 'AdSense'];
// La paleta roja de ZaraBus llega por tokens de app/globals.css (bg-accent, text-muted...), con valores
// distintos en tema claro y oscuro: en los .tsx no se admiten hex, degradados ni colores de la paleta fija de Tailwind.
const FIXED_COLOR_PATTERN =
  /#[0-9a-fA-F]{3,8}\b|gradient|(text|bg|border)-(slate|zinc|orange|gray|neutral|stone|red|green|blue|amber|emerald)-\d/;
const GLOBALS_CSS = path.join('app', 'globals.css');
const REQUIRED_TOKENS = [
  '--color-accent',
  '--color-accent-hover',
  '--color-accent-text',
  '--color-surface',
  '--color-card',
  '--color-line',
  '--color-ink',
  '--color-muted',
  '--color-live',
  '--color-demo',
];
const REQUIRED_MAP_VARIABLES = ['--map-stop-color', '--map-stop-border-color', '--map-selected-color', '--map-route-color', '--map-user-color'];
const LIGHT_THEME_BLOCK = /@theme static\s*\{([^}]*)\}/;
const DARK_THEME_BLOCK = /\[data-theme="dark"\]\s*\{([^}]*)\}/;
const DARK_TILE_FILTER = 'filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.3);';

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
  return readFileSync(path.join(process.cwd(), ...segments), 'utf-8').replace(/\r\n/g, '\n');
}

function uiThemeBlock(css: string, pattern: RegExp): string {
  const match = pattern.exec(css);
  assert.ok(match, `No se encuentra el bloque ${pattern} en globals.css`);
  return match[1];
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

test('colores: globals.css define todos los tokens en el tema claro y en el oscuro', () => {
  const css = uiRead(GLOBALS_CSS);
  const light = uiThemeBlock(css, LIGHT_THEME_BLOCK);
  const dark = uiThemeBlock(css, DARK_THEME_BLOCK);
  for (const token of REQUIRED_TOKENS) {
    assert.ok(light.includes(`${token}:`), `Falta ${token} en el tema claro`);
    assert.ok(dark.includes(`${token}:`), `Falta ${token} en el tema oscuro`);
  }
});

test('mapa: las variables de color del mapa existen y el tema oscuro redefine las que cambian', () => {
  const css = uiRead(GLOBALS_CSS);
  for (const variable of REQUIRED_MAP_VARIABLES) assert.ok(css.includes(`${variable}:`), `Falta ${variable}`);
  const dark = uiThemeBlock(css, DARK_THEME_BLOCK);
  for (const variable of ['--map-selected-color', '--map-route-color', '--map-user-color']) {
    assert.ok(dark.includes(`${variable}:`), `El tema oscuro no redefine ${variable}`);
  }
});

test('mapa: el filtro de teselas oscuras solo se aplica bajo data-theme="dark"', () => {
  const css = uiRead(GLOBALS_CSS);
  assert.ok(css.includes(`[data-theme="dark"] .leaflet-tile-pane {\n    ${DARK_TILE_FILTER}`));
  assert.equal(css.split(DARK_TILE_FILTER).length - 1, 1, 'El filtro debe aparecer una sola vez');
});

test('tema: el layout fija data-theme antes de pintar y la cabecera de las páginas legales tiene el botón', () => {
  const layout = uiRead('app', 'layout.tsx');
  assert.ok(layout.includes('THEME_INIT_SCRIPT'));
  assert.ok(layout.includes('suppressHydrationWarning'));
  assert.ok(THEME_INIT_SCRIPT.includes("'ododex-theme'"));
  assert.ok(uiRead('components', 'Header.tsx').includes('ThemeToggle'));
  assert.ok(uiRead('components', 'PanelHeader.tsx').includes('ThemeToggle'));
});

test('tema: el botón alterna el tema con aria-label y los logos de Ododex tienen variante clara y oscura', () => {
  assert.ok(uiRead('components', 'ThemeToggle.tsx').includes('aria-label'));
  const logo = uiRead('components', 'BrandLogo.tsx');
  assert.ok(logo.includes('ododex-logo-light.svg') && logo.includes('ododex-logo-dark.svg'));
});

test('leaflet: su CSS va en la capa base para que las utilidades de Tailwind ganen', () => {
  const css = uiRead(GLOBALS_CSS);
  assert.ok(css.includes('@import "leaflet/dist/leaflet.css" layer(base);'));
  assert.ok(css.includes('@import "leaflet.markercluster/dist/MarkerCluster.css" layer(base);'));
  assert.ok(!uiRead('app', 'layout.tsx').includes('leaflet'), 'layout.tsx no debe importar el CSS de Leaflet fuera de capa');
});
