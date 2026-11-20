import { Info, TriangleAlert } from 'lucide-react';

interface RouteNoticeProps {
  /** Línea cuyo recorrido se intenta dibujar; null = ninguna. */
  line: string | null;
  loading: boolean;
  /** True si el Ayuntamiento no publica el recorrido de la línea. */
  unavailable?: boolean;
  error?: string;
}

const LOADING_TEXT = 'Cargando recorrido…';
const NOTICE_CLASSES = 'flex items-start gap-1.5 px-4 pb-2 text-xs text-muted';

/** Estado discreto del recorrido de la línea: cargando, recorrido no publicado o fallo. */
export default function RouteNotice({ line, loading, unavailable, error }: RouteNoticeProps) {
  if (line === null) {
    return null;
  }
  if (loading) {
    return <p className={NOTICE_CLASSES}>{LOADING_TEXT}</p>;
  }
  if (unavailable === true) {
    return (
      <p className={NOTICE_CLASSES}>
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>El Ayuntamiento no publica el recorrido de la línea {line}: se muestran sus paradas.</span>
      </p>
    );
  }
  if (error !== undefined) {
    return (
      <p className={NOTICE_CLASSES} role="status">
        <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          No se pudo cargar el recorrido de la línea {line}: {error}
        </span>
      </p>
    );
  }
  return null;
}
