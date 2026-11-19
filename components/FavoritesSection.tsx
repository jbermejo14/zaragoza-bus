import type { BusStop } from '../lib/types';
import StopResultList from './StopResultList';

interface FavoritesSectionProps {
  favoriteStops: readonly BusStop[];
  onSelect: (stop: BusStop) => void;
}

/** «Mis paradas»: lista de favoritos o texto de ayuda si no hay ninguno. */
export default function FavoritesSection({ favoriteStops, onSelect }: FavoritesSectionProps) {
  return (
    <section aria-labelledby="favorites-title">
      <h2 id="favorites-title" className="mb-2 text-sm font-bold tracking-wide text-muted uppercase">
        Mis paradas
      </h2>
      {favoriteStops.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-4 text-sm text-muted">
          Aún no tienes paradas guardadas. Abre un poste y pulsa la estrella para añadirlo aquí.
        </p>
      ) : (
        <StopResultList items={favoriteStops.map((stop) => ({ stop }))} onSelect={onSelect} />
      )}
    </section>
  );
}
