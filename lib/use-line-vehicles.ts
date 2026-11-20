'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BusVehicle } from './bus-vehicles';
import { AUTO_REFRESH_INTERVAL_MS } from './config';
import { fetchLineVehicles, mergeVehicles, pickSampleStops, retainSeenVehicles } from './line-vehicles';
import type { BusStop } from './types';

/** Paradas de la línea que se consultan: bastan para ver prácticamente todos sus autobuses. */
export const LINE_SAMPLE_STOP_COUNT = 8;

/** Consultas a la vez: el GPS de Avanza es lento y el Worker ya limita las suyas. */
export const LINE_SAMPLE_CONCURRENCY = 4;

const STOP_NUMBER_SEPARATOR = ',';

interface LineVehiclesState {
  /** Línea a la que pertenece el resultado; sirve para descartar datos de una línea anterior. */
  line: string | null;
  vehicles: BusVehicle[];
  /** Ha respondido alguna parada con éxito: antes de eso no se sabe si hay autobuses. */
  hasData: boolean;
  /** La primera ronda de consultas de esta línea ha terminado (con éxito o no). */
  complete: boolean;
}

const EMPTY_STATE: LineVehiclesState = { line: null, vehicles: [], hasData: false, complete: false };

/** Resultado del hook: autobuses conocidos (null si no se sabe) y si ya han respondido todas las paradas. */
export interface LineVehiclesResult {
  vehicles: BusVehicle[] | null;
  /** Falso mientras la primera ronda sigue en curso: aún pueden aparecer más autobuses. */
  complete: boolean;
}

const UNKNOWN_RESULT: LineVehiclesResult = { vehicles: null, complete: false };

function addVehicles(previous: LineVehiclesState, line: string, incoming: BusVehicle[]): LineVehiclesState {
  const base = previous.line === line ? previous : { ...EMPTY_STATE, line };
  return { ...base, vehicles: mergeVehicles(base.vehicles, incoming), hasData: true };
}

function finishRound(previous: LineVehiclesState, line: string, seen: ReadonlySet<string> | null): LineVehiclesState {
  const base = previous.line === line ? previous : { ...EMPTY_STATE, line };
  // Sin ninguna respuesta (fallo total) se conserva lo anterior en vez de vaciar el mapa.
  const vehicles = seen === null ? base.vehicles : retainSeenVehicles(base.vehicles, seen);
  return { ...base, vehicles, complete: true };
}

/**
 * Todos los autobuses de la línea dada (null = ninguna). Pide una parada de muestra por petición, como
 * mucho `LINE_SAMPLE_CONCURRENCY` a la vez, y va uniendo por coche según llegan. Se refresca cada 30 s
 * partiendo de la lista anterior: al acabar el refresco se quitan los coches que no apareció en ninguna
 * respuesta. En pausa con la pestaña oculta. Sin datos demo ni error visible si falla.
 */
export function useLineVehicles(line: string | null, stops: readonly BusStop[]): LineVehiclesResult {
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
    let roundCounter = 0;
    let lastLoadAt = 0;

    const runRound = async () => {
      roundCounter += 1;
      const roundId = roundCounter;
      lastLoadAt = Date.now();
      const isCurrent = () => !cancelled && roundId === roundCounter;
      const seen = new Set<string>();
      let answeredStops = 0;
      let nextIndex = 0;

      const worker = async () => {
        while (isCurrent() && nextIndex < stopNumbers.length) {
          const stopNumber = stopNumbers[nextIndex];
          nextIndex += 1;
          try {
            const incoming = await fetchLineVehicles(line, [stopNumber], (url, init) => fetch(url, init));
            if (isCurrent()) {
              answeredStops += 1;
              incoming.forEach((vehicle) => seen.add(vehicle.vehicle));
              setState((previous) => addVehicles(previous, line, incoming));
            }
          } catch (error) {
            // Una parada lenta o caída no debe tirar el resto de la ronda: se avisa en consola y se sigue.
            console.warn('No se pudieron cargar los autobuses de la línea desde un poste', error);
          }
        }
      };

      const workerCount = Math.min(LINE_SAMPLE_CONCURRENCY, stopNumbers.length);
      await Promise.all(Array.from({ length: workerCount }, worker));
      if (isCurrent()) {
        setState((previous) => finishRound(previous, line, answeredStops > 0 ? seen : null));
      }
    };

    const refreshIfVisible = () => {
      if (!document.hidden) {
        void runRound();
      }
    };
    const handleVisibility = () => {
      if (!document.hidden && Date.now() - lastLoadAt > AUTO_REFRESH_INTERVAL_MS) {
        void runRound();
      }
    };

    void runRound();
    const intervalId = setInterval(refreshIfVisible, AUTO_REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [line, sampleKey]);

  if (line === null || state.line !== line) {
    return UNKNOWN_RESULT;
  }
  return { vehicles: state.hasData ? state.vehicles : null, complete: state.complete };
}
