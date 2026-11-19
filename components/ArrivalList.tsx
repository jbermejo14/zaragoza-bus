import type { Arrival } from '../lib/types';
import ArrivalRow from './ArrivalRow';

interface ArrivalListProps {
  arrivals: readonly Arrival[];
  /** True mientras se esperan los primeros datos del poste. */
  loading: boolean;
}

const SKELETON_ROW_COUNT = 3;

function arrivalKey(arrival: Arrival, index: number): string {
  return `${arrival.line}|${arrival.destination}|${index}`;
}

/** Llegadas del poste, con esqueleto al cargar y mensaje si no hay estimaciones. */
export default function ArrivalList({ arrivals, loading }: ArrivalListProps) {
  if (arrivals.length === 0 && loading) {
    return (
      <ul className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando tiempos de paso">
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <li key={index} className="h-[74px] animate-pulse rounded-xl border border-line bg-card" />
        ))}
      </ul>
    );
  }
  if (arrivals.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-card px-4 py-6 text-center text-muted">
        Este poste no tiene estimaciones ahora mismo
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {arrivals.map((arrival, index) => (
        <ArrivalRow key={arrivalKey(arrival, index)} arrival={arrival} />
      ))}
    </ul>
  );
}
