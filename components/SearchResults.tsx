import type { BusStop } from '../lib/types';
import StopResultList from './StopResultList';

interface SearchResultsProps {
  results: readonly BusStop[];
  loading: boolean;
  onSelect: (stop: BusStop) => void;
}

/** Resultados de la búsqueda o del filtro de línea; «Sin resultados» si no hay ninguno. */
export default function SearchResults({ results, loading, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-card px-4 py-6 text-center text-muted">
        {loading ? 'Cargando paradas…' : 'Sin resultados'}
      </p>
    );
  }
  return <StopResultList items={results.map((stop) => ({ stop }))} onSelect={onSelect} />;
}
