import { formatMinutes } from '../lib/format-time';
import type { Arrival } from '../lib/types';
import LineBadge from './LineBadge';

interface ArrivalRowProps {
  arrival: Arrival;
}

/** Fila de una línea: destino, primer bus en grande y segundo en gris. */
export default function ArrivalRow({ arrival }: ArrivalRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3">
      <LineBadge line={arrival.line} size="large" />
      <span className="min-w-0 flex-1 truncate font-medium">{arrival.destination}</span>
      <span className="shrink-0 text-right">
        <span className="block text-3xl font-bold tabular-nums text-accent">
          {formatMinutes(arrival.firstMinutes)}
        </span>
        <span className="block text-sm tabular-nums text-muted">
          {arrival.secondMinutes === null ? '—' : `luego ${formatMinutes(arrival.secondMinutes)}`}
        </span>
      </span>
    </li>
  );
}
