'use client';

import { useEffect, useState } from 'react';
import { fetchStops } from './bus-source';
import type { BusStop, DataSource } from './types';

interface StopsState {
  stops: BusStop[];
  source: DataSource | null;
  fallbackReason?: string;
  loading: boolean;
}

const INITIAL_STATE: StopsState = { stops: [], source: null, loading: true };

/** Carga una sola vez el listado de postes (API o, si falla, demo). */
export function useStops(): StopsState {
  const [state, setState] = useState<StopsState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    fetchStops((url, init) => fetch(url, init))
      .then((result) => {
        if (!cancelled) {
          setState({ stops: result.data, source: result.source, fallbackReason: result.fallbackReason, loading: false });
        }
      })
      .catch((error: unknown) => {
        // fetchStops no debería rechazar; si lo hace se registra y se libera el estado de carga.
        console.error('No se pudo cargar el listado de postes', error);
        if (!cancelled) {
          setState((previous) => ({ ...previous, loading: false }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
