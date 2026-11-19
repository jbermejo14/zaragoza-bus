import { Info } from 'lucide-react';
import type { Arrival, BusStop, DataSource } from '../lib/types';
import ArrivalList from './ArrivalList';
import StopBoardHeader from './StopBoardHeader';

interface StopBoardProps {
  stop: BusStop;
  arrivals: readonly Arrival[];
  loading: boolean;
  source: DataSource | null;
  fallbackReason?: string;
  updatedAt: Date | null;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onRefresh: () => void;
}

/** Marquesina de un poste: cabecera y lista de llegadas. */
export default function StopBoard({
  stop,
  arrivals,
  loading,
  source,
  fallbackReason,
  updatedAt,
  isFavorite,
  onBack,
  onToggleFavorite,
  onRefresh,
}: StopBoardProps) {
  return (
    <section aria-label={`Poste ${stop.number}`} className="flex flex-col gap-3">
      <StopBoardHeader
        stop={stop}
        isFavorite={isFavorite}
        loading={loading}
        updatedAt={updatedAt}
        onBack={onBack}
        onToggleFavorite={onToggleFavorite}
        onRefresh={onRefresh}
      />
      {source === 'demo' && (
        <p className="flex items-start gap-1.5 text-xs text-muted">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Datos simulados{fallbackReason ? `: ${fallbackReason}` : ''}</span>
        </p>
      )}
      <ArrivalList arrivals={arrivals} loading={loading} />
    </section>
  );
}
