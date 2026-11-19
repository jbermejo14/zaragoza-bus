'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { buildStopHash, isAppStopHistoryState, parseStopHash, STOP_HISTORY_MARKER } from './stop-hash';

/** Suscriptores del hash; `pushState` y `replaceState` no disparan `hashchange`, así que se avisa a mano. */
const hashListeners = new Set<() => void>();

function notifyHashListeners(): void {
  hashListeners.forEach((listener) => listener());
}

function subscribeToHash(onChange: () => void): () => void {
  hashListeners.add(onChange);
  window.addEventListener('hashchange', onChange);
  return () => {
    hashListeners.delete(onChange);
    window.removeEventListener('hashchange', onChange);
  };
}

function readHash(): string {
  return window.location.hash;
}

function readServerHash(): string {
  return '';
}

function openStop(number: string): void {
  const hash = buildStopHash(number);
  if (parseStopHash(window.location.hash) === null) {
    window.history.pushState(STOP_HISTORY_MARKER, '', hash);
  } else {
    // Cambio de poste con otro ya abierto: se reemplaza para que «atrás» vuelva al inicio.
    window.history.replaceState(window.history.state, '', hash);
  }
  notifyHashListeners();
}

function closeStop(): void {
  if (isAppStopHistoryState(window.history.state)) {
    window.history.back();
    return;
  }
  // Se llegó con el hash en la URL: no hay entrada anterior de la app a la que volver.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  notifyHashListeners();
}

/** Número de poste seleccionado según el hash de la URL y función para cambiarlo (null = inicio). */
export function useStopHash(): { stopNumber: string | null; selectStopNumber: (number: string | null) => void } {
  const hash = useSyncExternalStore(subscribeToHash, readHash, readServerHash);
  const selectStopNumber = useCallback((number: string | null) => {
    if (number === null) {
      closeStop();
    } else {
      openStop(number);
    }
  }, []);
  return { stopNumber: parseStopHash(hash), selectStopNumber };
}
