import { formatMinutes } from '../lib/format-time';
import type { Arrival } from '../lib/types';
import LineBadge from './LineBadge';

interface ArrivalRowProps {
  arrival: Arrival;
  /** True si el recorrido de esta línea se está dibujando por haberla pulsado aquí. */
  routeActive: boolean;
  onToggleRoute: (line: string) => void;
}

const BADGE_BUTTON_CLASSES =
  'shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const BADGE_ACTIVE_CLASSES = 'ring-2 ring-accent ring-offset-2 ring-offset-surface';

/** Fila de una línea: insignia pulsable (recorrido en el mapa), destino, primer bus en grande y segundo en gris. */
export default function ArrivalRow({ arrival, routeActive, onToggleRoute }: ArrivalRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3">
      <button
        type="button"
        className={`${BADGE_BUTTON_CLASSES} ${routeActive ? BADGE_ACTIVE_CLASSES : ''}`}
        aria-label={`Ver recorrido de la línea ${arrival.line} en el mapa`}
        aria-pressed={routeActive}
        onClick={() => onToggleRoute(arrival.line)}
      >
        <LineBadge line={arrival.line} size="large" />
      </button>
      <span className="min-w-0 flex-1 line-clamp-2 break-words font-medium">{arrival.destination}</span>
      <span className="shrink-0 text-right">
        <span className="block text-3xl font-bold tabular-nums text-accent-text">
          {formatMinutes(arrival.firstMinutes)}
        </span>
        <span className="block text-sm tabular-nums text-muted">
          {arrival.secondMinutes === null ? '—' : `luego ${formatMinutes(arrival.secondMinutes)}`}
        </span>
      </span>
    </li>
  );
}
