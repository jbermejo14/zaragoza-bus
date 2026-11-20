import { Bus } from 'lucide-react';

interface LineVehiclesNoticeProps {
  /** Línea seleccionada; null = ninguna. */
  line: string | null;
  /** Autobuses de la línea en servicio; null = aún no se sabe (cargando por primera vez o fallo). */
  count: number | null;
}

const NOTICE_CLASSES = 'flex items-start gap-1.5 px-4 pb-2 text-xs text-muted';

/** Texto del aviso: «3 autobuses de la línea 25 en servicio ahora» o «No hay autobuses de la línea 25 en servicio ahora». */
export function lineVehiclesNoticeText(line: string, count: number): string {
  if (count === 0) {
    return `No hay autobuses de la línea ${line} en servicio ahora`;
  }
  const noun = count === 1 ? 'autobús' : 'autobuses';
  return `${count} ${noun} de la línea ${line} en servicio ahora`;
}

/** Aviso discreto con cuántos autobuses de la línea seleccionada circulan; nada si no se sabe. */
export default function LineVehiclesNotice({ line, count }: LineVehiclesNoticeProps) {
  if (line === null || count === null) {
    return null;
  }
  return (
    <p className={NOTICE_CLASSES}>
      <Bus size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{lineVehiclesNoticeText(line, count)}</span>
    </p>
  );
}
