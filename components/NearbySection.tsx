import { LocateFixed } from 'lucide-react';
import { NEARBY_MAX_DISTANCE_METERS, NEARBY_STOP_LIMIT } from '../lib/config';
import { nearestStops } from '../lib/geo';
import type { BusStop, Coordinates } from '../lib/types';
import type { GeolocationStatus } from '../lib/use-geolocation';
import StopResultList from './StopResultList';

interface NearbySectionProps {
  stops: readonly BusStop[];
  position: Coordinates | null;
  status: GeolocationStatus;
  onRequestLocation: () => void;
  onSelect: (stop: BusStop) => void;
}

const STATUS_MESSAGES: Record<Exclude<GeolocationStatus, 'idle' | 'ready'>, string> = {
  locating: 'Buscando tu posición…',
  denied: 'Has denegado el permiso de ubicación. Actívalo en los ajustes del navegador para ver paradas cercanas.',
  unavailable: 'Tu ubicación no está disponible en este dispositivo o navegador.',
  error: 'No se pudo obtener tu ubicación. Inténtalo de nuevo.',
};

const METERS_PER_KILOMETER = 1000;
const NEARBY_MAX_DISTANCE_KM_TEXT = (NEARBY_MAX_DISTANCE_METERS / METERS_PER_KILOMETER).toLocaleString('es-ES');
const NO_NEARBY_MESSAGE = `No hay paradas a menos de ${NEARBY_MAX_DISTANCE_KM_TEXT} km de tu posición.`;

function NearbyContent({ stops, position, status, onSelect }: Omit<NearbySectionProps, 'onRequestLocation'>) {
  if (status === 'idle') {
    return null;
  }
  if (status !== 'ready') {
    return <p className="mt-3 text-sm text-muted">{STATUS_MESSAGES[status]}</p>;
  }
  if (position === null) {
    return <p className="mt-3 text-sm text-muted">{STATUS_MESSAGES.error}</p>;
  }
  const nearby = nearestStops(stops, position, NEARBY_STOP_LIMIT, NEARBY_MAX_DISTANCE_METERS);
  if (nearby.length === 0) {
    return <p className="mt-3 text-sm text-muted">{NO_NEARBY_MESSAGE}</p>;
  }
  return (
    <div className="mt-3">
      <StopResultList
        items={nearby.map(({ stop, distanceMeters }) => ({ stop, distanceMeters }))}
        onSelect={onSelect}
      />
    </div>
  );
}

/** «Cerca de mí»: botón de geolocalización, estados y lista de postes cercanos con distancia. */
export default function NearbySection({ stops, position, status, onRequestLocation, onSelect }: NearbySectionProps) {
  return (
    <section aria-labelledby="nearby-title">
      <h2 id="nearby-title" className="mb-2 text-sm font-bold tracking-wide text-muted uppercase">
        Cerca de mí
      </h2>
      <button
        type="button"
        onClick={onRequestLocation}
        disabled={status === 'locating'}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
      >
        <LocateFixed size={20} aria-hidden="true" />
        Buscar paradas cerca de mí
      </button>
      <NearbyContent stops={stops} position={position} status={status} onSelect={onSelect} />
    </section>
  );
}
