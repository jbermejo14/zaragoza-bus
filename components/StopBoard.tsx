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
  highlightedLine: string | null;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onRefresh: () => void;
  onToggleRoute: (line: string) => void;
}

const DEMO_NOTICE = 'La API del Ayuntamiento no responde ahora mismo: se muestran tiempos simulados.';

/** Marquesina de un poste: cabecera y lista de llegadas. */
export default function StopBoard({
  stop,
  arrivals,
  loading,
  source,
  fallbackReason,
  updatedAt,
  highlightedLine,
  isFavorite,
  onBack,
  onToggleFavorite,
  onRefresh,
  onToggleRoute,
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
        <p className="flex items-start gap-1.5 text-xs text-muted" title={fallbackReason}>
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{DEMO_NOTICE}</span>
        </p>
      )}
      <ArrivalList
        arrivals={arrivals}
        loading={loading}
        highlightedLine={highlightedLine}
        onToggleRoute={onToggleRoute}
      />
    </section>
  );
}
