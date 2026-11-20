'use client';

import { useCallback, useDeferredValue, useMemo, useRef, useState, type ReactNode } from 'react';
import { stopsForLine, visibleVehicles } from '../lib/line-filter';
import { findStopByNumber, listLines, searchStops } from '../lib/stop-search';
import { pickRouteLine, toggleHighlightedLine } from '../lib/route-line';
import type { BusStop } from '../lib/types';
import { useArrivals } from '../lib/use-arrivals';
import { useFavorites } from '../lib/use-favorites';
import { useGeolocation } from '../lib/use-geolocation';
import { useLineRoute } from '../lib/use-line-route';
import { useVehicles } from '../lib/use-vehicles';
import { useStopHash } from '../lib/use-stop-hash';
import { useStops } from '../lib/use-stops';
import AppPanel from './AppPanel';
import BusMapLoader from './BusMapLoader';
import HomePanel from './HomePanel';
import LineFilter from './LineFilter';
import PanelHeader from './PanelHeader';
import RouteNotice from './RouteNotice';
import SearchBox from './SearchBox';
import SearchResults from './SearchResults';
import StopBoard from './StopBoard';

interface ZaraBusAppProps {
  /** «Sobre este servicio» y pie de Ododex, pintados en el servidor (leen ficheros del disco). */
  panelFooter: ReactNode;
}

interface HighlightState {
  stopNumber: string;
  line: string | null;
}

/** Clave de lo que muestra el panel; al cambiar, la hoja móvil se abre al menos a media altura. */
function panelRevealKey(stopNumber: string | null, line: string | null, query: string): string | null {
  const trimmedQuery = query.trim();
  if (stopNumber === null && line === null && trimmedQuery === '') {
    return null;
  }
  return `${stopNumber ?? ''}|${line ?? ''}|${trimmedQuery}`;
}

/** Estado raíz: consulta, línea, poste seleccionado (en el hash); compone el mapa a pantalla completa y el panel. */
export default function ZaraBusApp({ panelFooter }: ZaraBusAppProps) {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
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
  const allVehicles = useVehicles(selectedStop);
  // La línea resaltada pertenece al poste en que se pulsó: al cerrarlo o cambiar de poste deja de valer.
  const highlightedLine = highlight !== null && highlight.stopNumber === stopNumber ? highlight.line : null;
  const lineRoute = useLineRoute(pickRouteLine(line, highlightedLine));
  const vehicles = useMemo(() => visibleVehicles(allVehicles, line), [allVehicles, line]);
  const lines = useMemo(() => listLines(stops), [stops]);
  const mapStops = useMemo(() => stopsForLine(stops, line), [stops, line]);
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
  const clearLineFilter = useCallback(() => setLine(null), []);

  const headerSource = selectedStop === null ? stopsState : arrivals;
  const isSearching = query.trim() !== '' || line !== null;

  const top = (
    <>
      <PanelHeader source={headerSource.source} fallbackReason={headerSource.fallbackReason} />
      <SearchBox value={query} onChange={changeQuery} onSubmit={submitSearch} />
      <LineFilter lines={lines} activeLine={line} onChange={setLine} />
      <RouteNotice
        line={pickRouteLine(line, highlightedLine)}
        route={lineRoute.route}
        loading={lineRoute.loading}
        error={lineRoute.error}
        fromFilter={line !== null}
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
      <AppPanel top={top} revealKey={panelRevealKey(stopNumber, line, query)} panelRef={panelRef}>
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
            onRefresh={arrivals.refresh}
          />
        ) : isSearching ? (
          <SearchResults results={results} loading={stopsState.loading} onSelect={selectStop} />
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
