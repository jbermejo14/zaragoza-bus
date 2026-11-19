import { useMemo } from 'react';
import type { Coordinates, BusStop } from '../lib/types';
import type { GeolocationStatus } from '../lib/use-geolocation';
import FavoritesSection from './FavoritesSection';
import NearbySection from './NearbySection';

interface HomePanelProps {
  stops: readonly BusStop[];
  favoriteIds: readonly string[];
  position: Coordinates | null;
  geolocationStatus: GeolocationStatus;
  onRequestLocation: () => void;
  onSelect: (stop: BusStop) => void;
}

/** Pantalla inicial: «Mis paradas» y «Cerca de mí». */
export default function HomePanel({
  stops,
  favoriteIds,
  position,
  geolocationStatus,
  onRequestLocation,
  onSelect,
}: HomePanelProps) {
  const favoriteStops = useMemo(
    () =>
      favoriteIds
        .map((id) => stops.find((stop) => stop.id === id))
        .filter((stop): stop is BusStop => stop !== undefined),
    [stops, favoriteIds],
  );

  return (
    <div className="flex flex-col gap-6">
      <FavoritesSection favoriteStops={favoriteStops} onSelect={onSelect} />
      <NearbySection
        stops={stops}
        position={position}
        status={geolocationStatus}
        onRequestLocation={onRequestLocation}
        onSelect={onSelect}
      />
    </div>
  );
}
