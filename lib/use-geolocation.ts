'use client';

import { useCallback, useState } from 'react';
import type { Coordinates } from './types';

export type GeolocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'error';

const POSITION_TIMEOUT_MS = 10_000;
const POSITION_MAX_AGE_MS = 60_000;

function statusForError(error: GeolocationPositionError): GeolocationStatus {
  if (error.code === error.PERMISSION_DENIED) {
    return 'denied';
  }
  return error.code === error.POSITION_UNAVAILABLE ? 'unavailable' : 'error';
}

/** Posición del usuario, solicitada solo cuando se llama a `request`. */
export function useGeolocation(): { position: Coordinates | null; status: GeolocationStatus; request: () => void } {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({ latitude: result.coords.latitude, longitude: result.coords.longitude });
        setStatus('ready');
      },
      (error) => setStatus(statusForError(error)),
      { enableHighAccuracy: false, timeout: POSITION_TIMEOUT_MS, maximumAge: POSITION_MAX_AGE_MS },
    );
  }, []);

  return { position, status, request };
}
