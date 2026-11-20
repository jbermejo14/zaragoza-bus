import { parseSheetHeightPx } from '../lib/bottom-sheet-math';

/** Anchura de ventana desde la que el panel es una tarjeta lateral (coincide con `lg:` de Tailwind). */
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';
/** Aire (px) entre lo que se encuadra y el borde libre del mapa. */
export const MAP_FIT_MARGIN_PX = 32;
/** Variable CSS con la altura de la hoja móvil (la fija `use-bottom-sheet`). */
export const SHEET_HEIGHT_VARIABLE = '--sheet-height';

export type PaddingPoint = [number, number];

/** Relleno para `fitBounds`: el espacio que tapa el panel más un margen. */
export interface FitPadding {
  topLeft: PaddingPoint;
  bottomRight: PaddingPoint;
}

/** Espacio del mapa que tapa el panel: ancho por la izquierda (escritorio) o alto por abajo (móvil). */
export interface PanelCover {
  left: number;
  bottom: number;
}

export const NO_PANEL_COVER: PanelCover = { left: 0, bottom: 0 };

/** Relleno de encuadre que deja libre el hueco tapado por el panel. */
export function computeFitPadding(cover: PanelCover): FitPadding {
  return {
    topLeft: [cover.left + MAP_FIT_MARGIN_PX, MAP_FIT_MARGIN_PX],
    bottomRight: [MAP_FIT_MARGIN_PX, cover.bottom + MAP_FIT_MARGIN_PX],
  };
}

/** True si, tras el relleno, queda hueco visible en un mapa de ese tamaño (en pestañas ocultas puede medir 0). */
export function hasUsableSpace(size: { x: number; y: number }, padding: FitPadding): boolean {
  const usableWidth = size.x - padding.topLeft[0] - padding.bottomRight[0];
  const usableHeight = size.y - padding.topLeft[1] - padding.bottomRight[1];
  return usableWidth > 0 && usableHeight > 0;
}

/**
 * Hueco que tapa el panel ahora mismo. En escritorio es su borde derecho. En móvil, la altura que
 * tendrá la hoja según su variable CSS (no la medida, porque puede estar a mitad de transición).
 */
export function measurePanelCover(panel: HTMLElement | null): PanelCover {
  if (panel === null) {
    return NO_PANEL_COVER;
  }
  if (window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
    return { left: panel.getBoundingClientRect().right, bottom: 0 };
  }
  const declared = parseSheetHeightPx(panel.style.getPropertyValue(SHEET_HEIGHT_VARIABLE), window.innerHeight);
  return { left: 0, bottom: declared ?? panel.offsetHeight };
}
