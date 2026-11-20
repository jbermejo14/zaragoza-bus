import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ArrivalList from '../components/ArrivalList';
import { Header } from '../components/Header';
import LineEmptyNotice from '../components/LineEmptyNotice';
import LineFilter from '../components/LineFilter';
import PanelFooter from '../components/PanelFooter';
import PanelHeader from '../components/PanelHeader';
import RouteNotice from '../components/RouteNotice';
import SearchResults from '../components/SearchResults';
import StopBoard from '../components/StopBoard';
import type { Arrival, BusStop } from '../lib/types';

const NOOP = () => undefined;
const STOP: BusStop = {
  id: 'tuzsa-104',
  number: '104',
  name: 'P. Independencia N.º 25',
  lines: ['21', '38'],
  coordinates: { latitude: 41.65, longitude: -0.88 },
};
const ARRIVALS: Arrival[] = [
  { line: '21', destination: 'Las Fuentes', firstMinutes: 4, secondMinutes: 15 },
  { line: '38', destination: 'Valdespartera', firstMinutes: 0, secondMinutes: null },
];

function renderBoard(lineFilter: string | null, arrivals: Arrival[] = ARRIVALS) {
  return renderToStaticMarkup(
    <StopBoard
      stop={STOP}
      arrivals={arrivals}
      loading={false}
      source="live"
      updatedAt={null}
      lineFilter={lineFilter}
      highlightedLine={null}
      isFavorite={false}
      onBack={NOOP}
      onToggleFavorite={NOOP}
      onRefresh={NOOP}
      onToggleRoute={NOOP}
      onClearLineFilter={NOOP}
    />,
  );
}

test('marquesina sin filtro muestra las llegadas de todas las líneas', () => {
  const html = renderBoard(null);
  assert.ok(html.includes('Las Fuentes') && html.includes('Valdespartera'));
  assert.ok(!html.includes('Ver todas las líneas'));
});

test('marquesina con filtro muestra solo las llegadas de esa línea', () => {
  const html = renderBoard('21');
  assert.ok(html.includes('Las Fuentes'));
  assert.ok(!html.includes('Valdespartera'));
});

test('marquesina con una línea sin llegadas muestra el aviso y el botón para quitar el filtro', () => {
  const html = renderBoard('35');
  assert.ok(html.includes('La línea 35 no tiene llegadas previstas en este poste'));
  assert.ok(html.includes('Ver todas las líneas'));
});

test('con filtro y sin ninguna llegada también se ofrece quitar el filtro', () => {
  assert.ok(renderBoard('21', []).includes('Ver todas las líneas'));
});

test('ArrivalList sin filtro y sin llegadas mantiene el mensaje genérico', () => {
  const html = renderToStaticMarkup(
    <ArrivalList arrivals={[]} loading={false} lineFilter={null} highlightedLine={null} onToggleRoute={NOOP} onClearLineFilter={NOOP} />,
  );
  assert.ok(html.includes('Este poste no tiene estimaciones ahora mismo'));
});

test('ArrivalList cargando por primera vez muestra el esqueleto aunque haya filtro', () => {
  const html = renderToStaticMarkup(
    <ArrivalList arrivals={[]} loading lineFilter="21" highlightedLine={null} onToggleRoute={NOOP} onClearLineFilter={NOOP} />,
  );
  assert.ok(html.includes('aria-busy="true"'));
  assert.ok(!html.includes('no tiene llegadas'));
});

test('LineEmptyNotice nombra la línea', () => {
  assert.ok(renderToStaticMarkup(<LineEmptyNotice line="Ci1" onClearFilter={NOOP} />).includes('La línea Ci1 no tiene'));
});

test('cabecera de las páginas legales: botón de tema y las dos variantes del logo', () => {
  const html = renderToStaticMarkup(<Header />);
  assert.ok(html.includes('Cambiar entre modo claro y oscuro'));
  assert.ok(html.includes('ododex-logo-light.svg') && html.includes('ododex-logo-dark.svg'));
});

test('cabecera del panel: título, subtítulo, indicador y botón de tema', () => {
  const html = renderToStaticMarkup(<PanelHeader source="demo" fallbackReason="sin red" />);
  assert.ok(html.includes('<h1'));
  assert.ok(html.includes('Autobús de Zaragoza'));
  assert.ok(html.includes('Tiempos de paso en tiempo real'));
  assert.ok(html.includes('Demo'));
  assert.ok(html.includes('Cambiar entre modo claro y oscuro'));
});

test('pie del panel: enlace a «Sobre este servicio», logos por tema, atribución OSM y enlaces legales', () => {
  const html = renderToStaticMarkup(<PanelFooter />);
  assert.ok(html.includes('href="/sobre-el-servicio"') && html.includes('Sobre este servicio y de dónde salen los datos'));
  assert.ok(html.includes('ododex-logo-light.svg') && html.includes('ododex-logo-dark.svg'));
  assert.ok(html.includes('https://www.openstreetmap.org/copyright'));
  for (const route of ['/aviso-legal', '/privacidad', '/cookies']) assert.ok(html.includes(`href="${route}"`), route);
});

function renderSearchResults(lines: string[], results: BusStop[]) {
  return renderToStaticMarkup(
    <SearchResults lines={lines} results={results} loading={false} onSelect={NOOP} onSelectLine={NOOP} />,
  );
}

test('resultados de búsqueda muestran el bloque de líneas como botones accesibles', () => {
  const html = renderSearchResults(['Ci1', 'Ci2'], [STOP]);
  assert.ok(html.includes('aria-label="Ver la línea Ci1"') && html.includes('aria-label="Ver la línea Ci2"'));
  assert.ok(html.includes('Abrir el poste 104'));
});

test('resultados con solo líneas no muestran «Sin resultados»', () => {
  assert.ok(!renderSearchResults(['Ci1'], []).includes('Sin resultados'));
});

test('resultados sin líneas ni paradas muestran «Sin resultados»', () => {
  assert.ok(renderSearchResults([], []).includes('Sin resultados'));
});

test('RouteNotice con recorrido no publicado muestra aviso informativo sin tono de error', () => {
  const html = renderToStaticMarkup(<RouteNotice line="Ci4" loading={false} unavailable />);
  assert.match(html, /El Ayuntamiento no publica el recorrido de la línea Ci4: se muestran sus paradas\./);
  assert.doesNotMatch(html, /No se pudo cargar/);
});

test('RouteNotice con recorrido cargado no muestra nota de antigüedad', () => {
  assert.equal(renderToStaticMarkup(<RouteNotice line="Ci4" loading={false} />), '');
});

test('LineFilter: el chip activo muestra «✕» y se anuncia como «Quitar la línea N»', () => {
  const html = renderToStaticMarkup(<LineFilter lines={['25', 'Ci2']} activeLine="Ci2" onChange={NOOP} />);
  assert.ok(html.includes('aria-label="Quitar la línea Ci2"'));
  assert.equal(html.split('aria-label="Quitar la línea').length - 1, 1);
});
