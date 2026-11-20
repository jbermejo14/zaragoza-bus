'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BusVehicle } from './bus-vehicles';
import { AUTO_REFRESH_INTERVAL_MS } from './config';
import { fetchLineVehicles, pickSampleStops } from './line-vehicles';
import type { BusStop } from './types';

/** Paradas de la línea que se consultan: bastan para ver prácticamente todos sus autobuses. */
export const LINE_SAMPLE_STOP_COUNT = 8;

const STOP_NUMBER_SEPARATOR = ',';

interface LineVehiclesState {
  /** Línea a la que pertenece el resultado; sirve para descartar datos de una línea anterior. */
  line: string | null;
  vehicles: BusVehicle[];
}

const EMPTY_STATE: LineVehiclesState = { line: null, vehicles: [] };

/**
 * Todos los autobuses de la línea dada (null = ninguna), consultando unas paradas repartidas por
 * ella. Se refresca cada 30 s, en pausa con la pestaña oculta y al volver a verla si ha pasado el
 * intervalo. Devuelve `null` mientras carga por primera vez o si falla (sin datos demo ni error
 * visible); un fallo puntual conserva las posiciones anteriores de la misma línea.
 */
export function useLineVehicles(line: string | null, stops: readonly BusStop[]): BusVehicle[] | null {
  const [state, setState] = useState<LineVehiclesState>(EMPTY_STATE);
  const sampleKey = useMemo(
    () => pickSampleStops(stops, LINE_SAMPLE_STOP_COUNT).map((stop) => stop.number).join(STOP_NUMBER_SEPARATOR),
    [stops],
  );

  useEffect(() => {
    if (line === null || sampleKey === '') {
      return;
    }
    const stopNumbers = sampleKey.split(STOP_NUMBER_SEPARATOR);
    let cancelled = false;
    let requestCounter = 0;
    let lastLoadAt = 0;

    const load = () => {
      requestCounter += 1;
      const requestId = requestCounter;
      lastLoadAt = Date.now();
      fetchLineVehicles(line, stopNumbers, (url, init) => fetch(url, init))
        .catch((error: unknown) => {
          console.warn('No se pudieron cargar los autobuses de la línea', error);
          return null;
        })
        .then((vehicles) => {
          // Solo vale la última petición de la línea activa: las anteriores llegan tarde.
          if (cancelled || requestId !== requestCounter || vehicles === null) {
            return;
          }
          setState({ line, vehicles });
        });
    };

    const refreshIfVisible = () => {
      if (!document.hidden) {
        load();
      }
    };
    const handleVisibility = () => {
      if (!document.hidden && Date.now() - lastLoadAt > AUTO_REFRESH_INTERVAL_MS) {
        load();
      }
    };

    load();
    const intervalId = setInterval(refreshIfVisible, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [line, sampleKey]);

  return line !== null && state.line === line ? state.vehicles : null;
}
