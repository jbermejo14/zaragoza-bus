import { ArrowLeft, RefreshCw, Star } from 'lucide-react';
import { formatClock } from '../lib/format-time';
import type { BusStop } from '../lib/types';
import StopNumberBadge from './StopNumberBadge';

interface StopBoardHeaderProps {
  stop: BusStop;
  isFavorite: boolean;
  loading: boolean;
  updatedAt: Date | null;
  onBack: () => void;
  onToggleFavorite: () => void;
  onRefresh: () => void;
}

const ICON_BUTTON_CLASSES =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface hover:border-accent hover:text-accent';

/** Cabecera de la marquesina: volver, número, nombre, favorito, refrescar y hora de actualización. */
export default function StopBoardHeader({
  stop,
  isFavorite,
  loading,
  updatedAt,
  onBack,
  onToggleFavorite,
  onRefresh,
}: StopBoardHeaderProps) {
  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onBack} aria-label="Volver al inicio" className={ICON_BUTTON_CLASSES}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <StopNumberBadge number={stop.number} size="large" />
        <h2 className="min-w-0 flex-1 pt-1 text-lg leading-tight font-bold">{stop.name}</h2>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'Quitar de Mis paradas' : 'Añadir a Mis paradas'}
          className={ICON_BUTTON_CLASSES}
        >
          <Star
            size={20}
            aria-hidden="true"
            className={isFavorite ? 'fill-accent text-accent' : ''}
          />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-muted">
        <span>{updatedAt === null ? 'Actualizando…' : `Actualizado ${formatClock(updatedAt)}`}</span>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refrescar tiempos de paso"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-semibold text-ink hover:border-accent hover:text-accent"
        >
          <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
          Refrescar
        </button>
      </div>
    </div>
  );
}
