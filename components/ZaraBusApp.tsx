'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { findStopByNumber, listLines, searchStops } from '../lib/stop-search';
import type { BusStop } from '../lib/types';
import { useArrivals } from '../lib/use-arrivals';
import { useFavorites } from '../lib/use-favorites';
import { useGeolocation } from '../lib/use-geolocation';
import { useStopHash } from '../lib/use-stop-hash';
import { useStops } from '../lib/use-stops';
import AppHeader from './AppHeader';
import BusMapLoader from './BusMapLoader';
import HomePanel from './HomePanel';
import LineFilter from './LineFilter';
import SearchBox from './SearchBox';
import SearchResults from './SearchResults';
import StopBoard from './StopBoard';

/** Estado raíz: consulta, línea, poste seleccionado (en el hash) y mapa visible en móvil. */
export default function ZaraBusApp() {
  const [query, setQuery] = useState('');
  const [line, setLine] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const deferredQuery = useDeferredValue(query);

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
  const lines = useMemo(() => listLines(stops), [stops]);
  const results = useMemo(() => searchStops(stops, deferredQuery, line), [stops, deferredQuery, line]);

  const selectStop = useCallback(
    (stop: BusStop) => {
      selectStopNumber(stop.number);
      setMapVisible(false);
    },
    [selectStopNumber],
  );
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
  const changeLine = useCallback(
    (nextLine: string | null) => {
      closeStopForSearch();
      setLine(nextLine);
    },
    [closeStopForSearch],
  );
  const submitSearch = useCallback(
    (text: string) => {
      const exactStop = findStopByNumber(stops, text.trim());
      if (exactStop !== null) {
        selectStop(exactStop);
      }
    },
    [stops, selectStop],
  );

  const headerSource = selectedStop === null ? stopsState : arrivals;
  const isSearching = query.trim() !== '' || line !== null;

  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      <section
        className={`flex min-h-0 flex-col lg:w-[420px] lg:flex-none lg:border-r lg:border-line ${
          mapVisible ? 'flex-none' : 'flex-1'
        }`}
      >
        <AppHeader
          source={headerSource.source}
          fallbackReason={headerSource.fallbackReason}
          mapVisible={mapVisible}
          onToggleMap={() => setMapVisible((visible) => !visible)}
        />
        <SearchBox value={query} onChange={changeQuery} onSubmit={submitSearch} />
        <LineFilter lines={lines} activeLine={line} onChange={changeLine} />
        <div className={`min-h-0 flex-1 overflow-y-auto px-4 pb-6 ${mapVisible ? 'hidden lg:block' : ''}`}>
          {selectedStop !== null ? (
            <StopBoard
              stop={selectedStop}
              arrivals={arrivals.arrivals}
              loading={arrivals.loading}
              source={arrivals.source}
              fallbackReason={arrivals.fallbackReason}
              updatedAt={arrivals.updatedAt}
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
        </div>
      </section>
      <div className={`relative min-h-0 lg:block lg:flex-1 ${mapVisible ? 'flex-1' : 'hidden'}`}>
        <BusMapLoader
          stops={stops}
          selectedStop={selectedStop}
          userPosition={geolocation.position}
          onSelectStop={selectStop}
        />
      </div>
    </div>
  );
}
