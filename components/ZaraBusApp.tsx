'use client';

import { useCallback, useDeferredValue, useMemo, useRef, useState, type ReactNode } from 'react';
import { stopsForLine, visibleVehicles } from '../lib/line-filter';
import { findStopByNumber, listLines, searchLines, searchStops } from '../lib/stop-search';
import { pickRouteLine, toggleHighlightedLine } from '../lib/route-line';
import type { BusVehicle } from '../lib/bus-vehicles';
import { mergeVehicles } from '../lib/line-vehicles';
import { shouldCloseStopForLine } from '../lib/line-selection';
import type { BusStop } from '../lib/types';
import { useArrivals } from '../lib/use-arrivals';
import { useFavorites } from '../lib/use-favorites';
import { useGeolocation } from '../lib/use-geolocation';
import { useLineRoute } from '../lib/use-line-route';
import { useLineVehicles } from '../lib/use-line-vehicles';
import { useVehicles } from '../lib/use-vehicles';
import { useStopHash } from '../lib/use-stop-hash';
import { useStops } from '../lib/use-stops';
import AppPanel from './AppPanel';
import BusMapLoader from './BusMapLoader';
import HomePanel from './HomePanel';
import LineStatusPill from './LineStatusPill';
import LineFilter from './LineFilter';
import RouteNotice from './RouteNotice';
import SearchBox from './SearchBox';
import SearchResults from './SearchResults';
import StopBoard from './StopBoard';

interface ZaraBusAppProps {
  /** enlace a «Sobre este servicio» y pie de Ododex, pintados en el servidor (leen ficheros del disco). */
  panelFooter: ReactNode;
}

interface HighlightState {
  stopNumber: string;
  line: string | null;
}

/** Clave de lo que muestra el panel (poste o búsqueda); al cambiar, la hoja móvil se abre al menos a media altura. */
function panelRevealKey(stopNumber: string | null, query: string): string | null {
  const trimmedQuery = query.trim();
  if (stopNumber === null && trimmedQuery === '') {
    return null;
  }
  return `${stopNumber ?? ''}|${trimmedQuery}`;
}

const NO_VEHICLES: readonly BusVehicle[] = [];

/**
 * Autobuses que dibuja el mapa. Con línea: todos los de la línea y, unidos por coche con prioridad de los datos
 * del poste, los que van al poste abierto (con minutos). Sin línea: los que van al poste abierto, o ninguno.
 */
function vehiclesToDraw(
  stopVehicles: readonly BusVehicle[],
  lineVehicles: readonly BusVehicle[] | null,
  line: string | null,
): readonly BusVehicle[] {
  if (line === null) {
    return stopVehicles;
  }
  return mergeVehicles(lineVehicles ?? NO_VEHICLES, visibleVehicles(stopVehicles, line));
}

/** Estado raíz: consulta, línea, poste seleccionado (en el hash); compone el mapa a pantalla completa y el panel. */
export default function ZaraBusApp({ panelFooter }: ZaraBusAppProps) {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
  const [collapseRequest, setCollapseRequest] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const panelRef = useRef<HTMLElement>(null);

  const stopsState = useStops();
  const favorites = useFavorites();
  const geolocation = useGeolocation();
  const { stopNumber, selectStopNumber } = useStopHash();

  const { stops } = stopsState;
  const selectedStop = useMemo(
    () => (stopNumber === null ? null : findStopByNumber(stops, stopNumber)),
    [stops, stopNumber],
  );
  const arrivals = useArrivals(selectedStop);
  const { vehicles: allVehicles, refresh: refreshStopVehicles } = useVehicles(selectedStop);
  // La línea resaltada pertenece al poste en que se pulsó: al cerrarlo o cambiar de poste deja de valer.
  const highlightedLine = highlight !== null && highlight.stopNumber === stopNumber ? highlight.line : null;
  const lineRoute = useLineRoute(pickRouteLine(line, highlightedLine));
  
  const lines = useMemo(() => listLines(stops), [stops]);
  const mapStops = useMemo(() => stopsForLine(stops, line), [stops, line]);
  const lineVehicles = useLineVehicles(line, mapStops);
  const vehicles = useMemo(
    () => vehiclesToDraw(allVehicles, lineVehicles.vehicles, line),
    [allVehicles, lineVehicles.vehicles, line],
  );
  const matchedLines = useMemo(() => searchLines(lines, deferredQuery), [lines, deferredQuery]);
  const results = useMemo(() => searchStops(stops, deferredQuery, line), [stops, deferredQuery, line]);

  const closeStopForSearch = useCallback(() => {
    if (stopNumber !== null) {
      selectStopNumber(null);
    }
  }, [stopNumber, selectStopNumber]);
  const changeQuery = useCallback(
    (text: string) => {
      closeStopForSearch();
      setQuery(text);
    },
    [closeStopForSearch],
  );
  const submitSearch = useCallback(
    (text: string) => {
      const exactStop = findStopByNumber(stops, text.trim());
      if (exactStop !== null) {
        selectStopNumber(exactStop.number);
      }
    },
    [stops, selectStopNumber],
  );
  const toggleRoute = useCallback(
    (pressedLine: string) => {
      if (stopNumber !== null) {
        setHighlight({ stopNumber, line: toggleHighlightedLine(highlightedLine, pressedLine) });
      }
    },
    [stopNumber, highlightedLine],
  );
  const selectStop = useCallback((stop: BusStop) => selectStopNumber(stop.number), [selectStopNumber]);
  // Elegir línea: cierra la parada abierta si no pasa por ella y baja la hoja móvil para ver el mapa. Si la
  // parada pasa por la línea manda la parada: se queda abierta, filtrada, y ni el mapa ni la hoja se mueven.
  const changeLine = useCallback(
    (nextLine: string | null) => {
      setLine(nextLine);
      if (nextLine === null) {
        return;
      }
      const closesStop = shouldCloseStopForLine(selectedStop, nextLine);
      if (closesStop) {
        selectStopNumber(null);
      }
      if (selectedStop === null || closesStop) {
        setCollapseRequest((count) => count + 1);
      }
    },
    [selectedStop, selectStopNumber],
  );
  const selectLineFromSearch = useCallback(
    (selectedLine: string) => {
      changeLine(selectedLine);
      setQuery('');
    },
    [changeLine],
  );
  const clearLineFilter = useCallback(() => changeLine(null), [changeLine]);

  const isSearching = query.trim() !== '' || line !== null;

  const top = (
    <>
      <SearchBox value={query} onChange={changeQuery} onSubmit={submitSearch} />
      <LineFilter lines={lines} activeLine={line} onChange={changeLine} />
      <RouteNotice
        line={pickRouteLine(line, highlightedLine)}
        loading={lineRoute.loading}
        unavailable={lineRoute.unavailable}
        error={lineRoute.error}
      />
    </>
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 isolate">
        <BusMapLoader
          stops={mapStops}
          selectedStop={selectedStop}
          userPosition={geolocation.position}
          lineFilter={line}
          route={lineRoute.route}
          routeSettled={!lineRoute.loading}
          panelRef={panelRef}
          vehicles={vehicles}
          onSelectStop={selectStop}
        />
      </div>
<LineStatusPill        line={line}        vehicles={lineVehicles.vehicles === null ? 0 : lineVehicles.vehicles.length}        complete={lineVehicles.complete}        failed={lineVehicles.failed}        onRefresh={lineVehicles.refresh}        onClear={clearLineFilter}      />
      <AppPanel top={top} revealKey={panelRevealKey(stopNumber, query)} collapseRequest={collapseRequest} panelRef={panelRef}>
        {selectedStop !== null ? (
          <StopBoard
            stop={selectedStop}
            arrivals={arrivals.arrivals}
            loading={arrivals.loading}
            source={arrivals.source}
            fallbackReason={arrivals.fallbackReason}
            updatedAt={arrivals.updatedAt}
            lineFilter={line}
            highlightedLine={highlightedLine}
            onToggleRoute={toggleRoute}
            onClearLineFilter={clearLineFilter}
            isFavorite={favorites.isFavorite(selectedStop.id)}
            onBack={() => selectStopNumber(null)}
            onToggleFavorite={() => favorites.toggle(selectedStop.id)}
            onRefresh={() => {
              arrivals.refresh();
              refreshStopVehicles();
              if (line !== null) lineVehicles.refresh();
            }}
          />
        ) : isSearching ? (
          <SearchResults
            lines={matchedLines}
            results={results}
            loading={stopsState.loading}
            onSelect={selectStop}
            onSelectLine={selectLineFromSearch}
          />
        ) : (
          <HomePanel
            stops={stops}
            favoriteIds={favorites.favorites}
            position={geolocation.position}
            geolocationStatus={geolocation.status}
            onRequestLocation={geolocation.request}
            onSelect={selectStop}
          />
        )}
        {panelFooter}
      </AppPanel>
    </div>
  );
}
