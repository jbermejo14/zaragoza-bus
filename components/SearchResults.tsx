import type { BusStop } from '../lib/types';
import LineBadge from './LineBadge';
import StopResultList from './StopResultList';

interface SearchResultsProps {
  /** Líneas que coinciden con la consulta. */
  lines: readonly string[];
  results: readonly BusStop[];
  loading: boolean;
  onSelect: (stop: BusStop) => void;
  /** Se llama al pulsar una línea: activa su filtro. */
  onSelectLine: (line: string) => void;
}

const SECTION_TITLE_CLASS = 'mb-2 text-sm font-semibold text-muted';

interface LineResultsProps {
  lines: readonly string[];
  onSelectLine: (line: string) => void;
}

function LineResults({ lines, onSelectLine }: LineResultsProps) {
  return (
    <section aria-label="Líneas" className="mb-4">
      <h2 className={SECTION_TITLE_CLASS}>Líneas</h2>
      <ul className="flex flex-wrap gap-2">
        {lines.map((line) => (
          <li key={line}>
            <button
              type="button"
              onClick={() => onSelectLine(line)}
              aria-label={`Ver la línea ${line}`}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:opacity-90"
            >
              <LineBadge line={line} size="large" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Resultados de la búsqueda: bloque «Líneas» y bloque «Paradas»; «Sin resultados» si no hay ninguno. */
export default function SearchResults({ lines, results, loading, onSelect, onSelectLine }: SearchResultsProps) {
  if (lines.length === 0 && results.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-card px-4 py-6 text-center text-muted">
        {loading ? 'Cargando paradas…' : 'Sin resultados'}
      </p>
    );
  }
  return (
    <>
      {lines.length > 0 && <LineResults lines={lines} onSelectLine={onSelectLine} />}
      {results.length > 0 && (
        <section aria-label="Paradas">
          {lines.length > 0 && <h2 className={SECTION_TITLE_CLASS}>Paradas</h2>}
          <StopResultList items={results.map((stop) => ({ stop }))} onSelect={onSelect} />
        </section>
      )}
    </>
  );
}
