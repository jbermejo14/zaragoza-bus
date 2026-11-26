'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStopVehicles } from './bus-vehicles';
import type { BusVehicle } from './bus-vehicles';
import { AUTO_REFRESH_INTERVAL_MS } from './config';
import type { BusStop } from './types';

interface VehiclesState {
  /** Poste al que pertenece el resultado; sirve para descartar datos de un poste anterior. */
  stopId: string | null;
  vehicles: BusVehicle[];
}

/** Misma referencia en cada render sin datos, para no repintar la capa del mapa en vano. */
const NO_VEHICLES: BusVehicle[] = [];

const EMPTY_STATE: VehiclesState = { stopId: null, vehicles: NO_VEHICLES };

/**
 * Autobuses con posición GPS que se acercan al poste dado (null = ninguno). Misma cadencia que
 * `useArrivals`: al cambiar de poste y cada 30 s, en pausa con la pestaña oculta. Si la petición
 * falla no hay error visible (los tiempos son la información principal): lista vacía y aviso en consola.
 */
export interface VehiclesResult {
  vehicles: BusVehicle[];
  refresh: () => void;
}

export function useVehicles(stop: BusStop | null): VehiclesResult {
  const [state, setState] = useState<VehiclesState>(EMPTY_STATE);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (stop === null) {
      return;
    }
    let cancelled = false;
    let requestCounter = 0;
    let lastLoadAt = 0;

    const load = () => {
      requestCounter += 1;
      const requestId = requestCounter;
      lastLoadAt = Date.now();
      fetchStopVehicles(stop.number, (url, init) => fetch(url, init))
        .then((result) => result.vehicles)
        .catch((error: unknown) => {
          console.warn('No se pudieron cargar las posiciones de los autobuses', error);
          return null;
        })
        .then((vehicles) => {
          // Solo vale la última petición del poste actual: las anteriores llegan tarde.
          if (cancelled || requestId !== requestCounter) {
            return;
          }
          // Un fallo puntual (el GPS de Avanza a veces tarda demasiado) conserva las posiciones
          // anteriores del mismo poste en vez de vaciar el mapa hasta el siguiente refresco.
          setState((previous) =>
            vehicles !== null
              ? { stopId: stop.id, vehicles }
              : previous.stopId === stop.id
                ? previous
                : { stopId: stop.id, vehicles: NO_VEHICLES },
          );
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
  const vehicles = stop !== null && state.stopId === stop.id ? state.vehicles : NO_VEHICLES;
  return { vehicles, refresh };
}
