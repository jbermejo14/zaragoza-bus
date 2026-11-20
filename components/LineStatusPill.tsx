import { Bus, LoaderCircle, X } from 'lucide-react';
import { LINE_PILL_HEIGHT_PX, lineStatusText } from '../lib/line-selection';
import LineBadge from './LineBadge';

interface LineStatusPillProps {
  /** Línea seleccionada; null = no se pinta nada. */
  line: string | null;
  /** Autobuses de la línea encontrados hasta ahora. */
  vehicles: number;
  /** La primera ronda de consultas ha terminado. */
  complete: boolean;
  /** La primera ronda terminó sin respuesta de ninguna parada. */
  failed: boolean;
  onClear: () => void;
}

/** Icono de carga mientras se consulta, aviso si falla y autobús cuando hay resultado. */
function StatusIcon({ complete, failed }: { complete: boolean; failed: boolean }) {
  if (failed || complete) {
    return <Bus size={20} className="shrink-0 text-accent-text" aria-hidden="true" />;
  }
  return <LoaderCircle size={20} className="shrink-0 animate-spin text-accent-text" aria-hidden="true" />;
}

/**
 * Píldora flotante sobre el mapa con el estado de los autobuses de la línea seleccionada y el botón para
 * quitarla. Arriba y centrada: en móvil bajo la barra de estado; en escritorio, en el área libre a la
 * derecha del panel.
 */
export default function LineStatusPill({ line, vehicles, complete, failed, onClear }: LineStatusPillProps) {
  if (line === null) {
    return null;
  }
  const finished = complete && !failed;
  const textClasses = finished ? 'text-lg font-bold' : 'text-sm font-semibold';
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-30 flex justify-center px-3 lg:left-[var(--panel-right-edge)]">
      <div
        style={{ height: LINE_PILL_HEIGHT_PX }}
        className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/95 py-1 pl-3 pr-1 text-ink shadow-lg backdrop-blur"
      >
        <LineBadge line={line} />
        <StatusIcon complete={complete} failed={failed} />
        <span aria-live="polite" className={`min-w-0 truncate ${textClasses}`}>
          {lineStatusText({ vehicles, complete, failed })}
        </span>
        <button
          type="button"
          aria-label={`Quitar la línea ${line}`}
          onClick={onClear}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-card hover:text-accent-text"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
