import { formatDistance } from '../lib/geo';
import type { BusStop } from '../lib/types';
import LineBadge from './LineBadge';
import StopNumberBadge from './StopNumberBadge';

export interface StopResultItem {
  stop: BusStop;
  /** Distancia al usuario en metros, si se conoce. */
  distanceMeters?: number;
}

interface StopResultListProps {
  items: readonly StopResultItem[];
  onSelect: (stop: BusStop) => void;
}

/** Lista de postes: insignia con el número, nombre, líneas y distancia opcional. */
export default function StopResultList({ items, onSelect }: StopResultListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map(({ stop, distanceMeters }) => (
        <li key={stop.id}>
          <button
            type="button"
            onClick={() => onSelect(stop)}
            aria-label={`Abrir el poste ${stop.number}, ${stop.name}`}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 text-left hover:border-accent"
          >
            <StopNumberBadge number={stop.number} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{stop.name}</span>
              <span className="mt-1 flex flex-wrap gap-1">
                {stop.lines.map((line) => (
                  <LineBadge key={line} line={line} />
                ))}
              </span>
            </span>
            {distanceMeters !== undefined && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">
                {formatDistance(distanceMeters)}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
