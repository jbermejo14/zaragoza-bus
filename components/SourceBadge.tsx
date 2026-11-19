import type { DataSource } from '../lib/types';

interface SourceBadgeProps {
  source: DataSource | null;
  /** Motivo de la caída a datos simulados; se muestra como `title`. */
  fallbackReason?: string;
}

const LIVE_TITLE = 'Tiempos de paso en tiempo real';
const DEMO_TITLE_FALLBACK = 'Datos simulados';

/** Indicador de origen de los datos: «En vivo» (verde) o «Demo» (ámbar). */
export default function SourceBadge({ source, fallbackReason }: SourceBadgeProps) {
  if (source === null) {
    return null;
  }
  const isLive = source === 'live';
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink"
      title={isLive ? LIVE_TITLE : (fallbackReason ?? DEMO_TITLE_FALLBACK)}
    >
      <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-live' : 'bg-demo'}`} aria-hidden="true" />
      {isLive ? 'En vivo' : 'Demo'}
    </span>
  );
}
