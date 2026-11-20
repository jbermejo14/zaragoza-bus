import { sameLine } from './line-filter';
import type { BusStop } from './types';

/** Alto (px) de la píldora de estado de la línea: lo comparten su maqueta y el relleno de encuadre. */
export const LINE_PILL_HEIGHT_PX = 52;
/** Distancia (px) entre el borde superior del mapa y la píldora. */
export const LINE_PILL_TOP_OFFSET_PX = 12;
/** Aire (px) entre la píldora y lo encuadrado, y en los laterales del encuadre. */
export const LINE_FIT_MARGIN_PX = 24;

type PaddingPoint = [number, number];

/** Relleno de `fitBounds` para encuadrar una línea. */
export interface LineFitPadding {
  topLeft: PaddingPoint;
  bottomRight: PaddingPoint;
}

export interface LineFitPaddingInput {
  /** Panel como hoja inferior (true) o como tarjeta lateral (false). */
  isMobile: boolean;
  /** Altura de la hoja inferior (la objetivo, no la medida a mitad de transición); solo cuenta en móvil. */
  sheetHeightPx: number;
  /** Borde derecho de la tarjeta lateral; solo cuenta en escritorio. */
  panelRightPx: number;
  /** Alto de la píldora de estado, que tapa la parte superior del mapa. */
  pillHeightPx: number;
}

/**
 * True si hay que cerrar la parada abierta al elegir la línea: la parada no pasa por ella.
 * Sin parada abierta no hay nada que cerrar.
 */
export function shouldCloseStopForLine(stop: BusStop | null, line: string): boolean {
  return stop !== null && !stop.lines.some((candidate) => sameLine(candidate, line));
}

/**
 * Relleno para encuadrar el recorrido de la línea: arriba deja sitio a la píldora; en móvil, abajo la
 * altura de la hoja; en escritorio, a la izquierda el borde del panel. Laterales de `LINE_FIT_MARGIN_PX`.
 */
export function lineFitPadding(input: LineFitPaddingInput): LineFitPadding {
  const top = LINE_PILL_TOP_OFFSET_PX + input.pillHeightPx + LINE_FIT_MARGIN_PX;
  if (input.isMobile) {
    return {
      topLeft: [LINE_FIT_MARGIN_PX, top],
      bottomRight: [LINE_FIT_MARGIN_PX, input.sheetHeightPx + LINE_FIT_MARGIN_PX],
    };
  }
  return {
    topLeft: [input.panelRightPx + LINE_FIT_MARGIN_PX, top],
    bottomRight: [LINE_FIT_MARGIN_PX, LINE_FIT_MARGIN_PX],
  };
}

export interface LineStatusInput {
  /** Autobuses de la línea encontrados hasta ahora. */
  vehicles: number;
  /** La primera ronda de consultas ha terminado. */
  complete: boolean;
  /** La primera ronda terminó sin respuesta de ninguna parada. */
  failed: boolean;
}

/** Texto de estado de la píldora de la línea seleccionada. */
export function lineStatusText({ vehicles, complete, failed }: LineStatusInput): string {
  if (failed) {
    return 'Autobuses no disponibles';
  }
  if (!complete) {
    return vehicles > 0 ? `Cargando autobuses… ${vehicles}` : 'Cargando autobuses…';
  }
  if (vehicles === 0) {
    return 'Sin autobuses ahora';
  }
  return vehicles === 1 ? '1 autobús' : `${vehicles} autobuses`;
}
