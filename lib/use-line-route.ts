'use client';

import { useEffect, useState } from 'react';
import { describeFailure } from './bus-source';
import { fetchLineRoute } from './line-route';
import type { LineRoute } from './line-route';

interface LineRouteState {
  /** Línea a la que pertenece el resultado; sirve para descartar datos de una línea anterior. */
  line: string | null;
  error?: string;
}

export interface LineRouteResult {
  route: LineRoute | null;
  loading: boolean;
  error?: string;
}

/** Caché en memoria de los trazados ya descargados (los datos oficiales no cambian durante la sesión). */
const routeCache = new Map<string, LineRoute>();

const IDLE_RESULT: LineRouteResult = { route: null, loading: false };

/** Trazado oficial de la línea dada (null = ninguna). Cachea por línea e ignora respuestas de líneas ya no activas. */
export function useLineRoute(line: string | null): LineRouteResult {
  const [state, setState] = useState<LineRouteState>({ line: null });

  useEffect(() => {
    if (line === null || routeCache.has(line)) {
      return;
    }
    let cancelled = false;
    setState({ line });
    fetchLineRoute(line, (url, init) => fetch(url, init))
      .then((route) => {
        routeCache.set(line, route);
        if (!cancelled) {
          setState({ line });
        }
      })
      .catch((error: unknown) => {
        // El fallo no se traga: se guarda su descripción para mostrarla al usuario.
        if (!cancelled) {
          setState({ line, error: describeFailure(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [line]);

  if (line === null) {
    return IDLE_RESULT;
  }
  const cached = routeCache.get(line);
  if (cached !== undefined) {
    return { route: cached, loading: false };
  }
  if (state.line === line && state.error !== undefined) {
    return { route: null, loading: false, error: state.error };
  }
  return { route: null, loading: true };
}
