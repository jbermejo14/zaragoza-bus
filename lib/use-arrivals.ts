'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchArrivals } from './bus-source';
import { AUTO_REFRESH_INTERVAL_MS } from './config';
import type { Arrival, BusStop, DataSource } from './types';

interface ArrivalsState {
  /** Poste al que pertenece el resultado; sirve para descartar datos de un poste anterior. */
  stopId: string | null;
  arrivals: Arrival[];
  source: DataSource | null;
  fallbackReason?: string;
  loading: boolean;
  updatedAt: Date | null;
}

export interface ArrivalsResult {
  arrivals: Arrival[];
  source: DataSource | null;
  fallbackReason?: string;
  loading: boolean;
  updatedAt: Date | null;
  refresh: () => void;
}

const EMPTY_STATE: ArrivalsState = {
  stopId: null,
  arrivals: [],
  source: null,
  loading: false,
  updatedAt: null,
};

/**
 * Tiempos de paso del poste dado (null = ninguno). Refresca al cambiar de poste y cada 30 s,
 * se pausa con la pestaña oculta y refresca al volver si ha pasado más de ese intervalo.
 */
export function useArrivals(stop: BusStop | null): ArrivalsResult {
  const [state, setState] = useState<ArrivalsState>(EMPTY_STATE);
  const loadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (stop === null) {
      loadRef.current = () => undefined;
      return;
    }
    let cancelled = false;
    let requestCounter = 0;
    let lastLoadAt = 0;

    const load = () => {
      requestCounter += 1;
      const requestId = requestCounter;
      lastLoadAt = Date.now();
      setState((previous) =>
        previous.stopId === stop.id ? { ...previous, loading: true } : { ...EMPTY_STATE, stopId: stop.id, loading: true },
      );
      fetchArrivals(stop, (url, init) => fetch(url, init))
        .then((result) => {
          // Solo vale la última petición del poste actual: las anteriores llegan tarde.
          if (cancelled || requestId !== requestCounter) {
            return;
          }
          setState({
            stopId: stop.id,
            arrivals: result.data,
            source: result.source,
            fallbackReason: result.fallbackReason,
            loading: false,
            updatedAt: new Date(),
          });
        })
        .catch((error: unknown) => {
          // fetchArrivals no debería rechazar; si lo hace se registra y se libera el estado de carga.
          console.error('No se pudieron cargar los tiempos de paso', error);
          if (!cancelled && requestId === requestCounter) {
            setState((previous) => ({ ...previous, loading: false }));
          }
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

    loadRef.current = load;
    load();
    const intervalId = setInterval(refreshIfVisible, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [stop]);

  const refresh = useCallback(() => loadRef.current(), []);

  if (stop === null || state.stopId !== stop.id) {
    return { ...EMPTY_STATE, loading: stop !== null, refresh };
  }
  return { ...state, refresh };
}
