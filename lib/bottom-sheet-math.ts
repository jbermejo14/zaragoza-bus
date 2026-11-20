/** Altura de la hoja recogida (buscador visible), como fracción de la altura de la ventana. */
export const SHEET_COLLAPSED_RATIO = 0.28;
/** Altura de la hoja a media pantalla. */
export const SHEET_HALF_RATIO = 0.55;
/** Altura de la hoja desplegada. */
export const SHEET_EXPANDED_RATIO = 0.88;
/** Desplazamiento máximo (px) para considerar que un gesto sobre el asa es un toque y no un arrastre. */
export const SHEET_TAP_THRESHOLD_PX = 6;

export type SheetAnchor = 'collapsed' | 'half' | 'expanded';

/** Alturas ancladas, de menor a mayor. */
export const SHEET_ANCHORS: readonly SheetAnchor[] = ['collapsed', 'half', 'expanded'];

const ANCHOR_RATIOS: Record<SheetAnchor, number> = {
  collapsed: SHEET_COLLAPSED_RATIO,
  half: SHEET_HALF_RATIO,
  expanded: SHEET_EXPANDED_RATIO,
};

/** Altura en píxeles de cada posición anclada. */
export function sheetAnchorHeight(anchor: SheetAnchor, viewportHeight: number): number {
  return viewportHeight * ANCHOR_RATIOS[anchor];
}

/** Mantiene la altura arrastrada entre la posición más baja y la más alta. */
export function clampSheetHeight(heightPx: number, viewportHeight: number): number {
  return Math.min(
    sheetAnchorHeight('expanded', viewportHeight),
    Math.max(sheetAnchorHeight('collapsed', viewportHeight), heightPx),
  );
}

/** Posición anclada más cercana a la altura en la que se suelta el asa. */
export function nearestSheetAnchor(heightPx: number, viewportHeight: number): SheetAnchor {
  return SHEET_ANCHORS.reduce((best, candidate) =>
    Math.abs(sheetAnchorHeight(candidate, viewportHeight) - heightPx) <
    Math.abs(sheetAnchorHeight(best, viewportHeight) - heightPx)
      ? candidate
      : best,
  );
}

/** Un toque sube a la siguiente altura; desde la más alta vuelve a la recogida. */
export function nextSheetAnchor(anchor: SheetAnchor): SheetAnchor {
  const index = SHEET_ANCHORS.indexOf(anchor);
  return SHEET_ANCHORS[(index + 1) % SHEET_ANCHORS.length];
}

/** La más alta de las dos posiciones: sirve para abrir la hoja sin cerrarla si ya está más arriba. */
export function higherSheetAnchor(first: SheetAnchor, second: SheetAnchor): SheetAnchor {
  return SHEET_ANCHORS.indexOf(first) >= SHEET_ANCHORS.indexOf(second) ? first : second;
}

const PERCENT = 100;
const DYNAMIC_VIEWPORT_UNIT = 'dvh';
const PIXEL_UNIT = 'px';

/**
 * Altura en píxeles que expresa el valor CSS de `--sheet-height` (`NN.Ndvh` o `NNpx`).
 * Devuelve null si el valor no tiene ninguno de los dos formatos.
 */
export function parseSheetHeightPx(cssValue: string, viewportHeight: number): number | null {
  const value = cssValue.trim();
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) {
    return null;
  }
  if (value.endsWith(DYNAMIC_VIEWPORT_UNIT)) {
    return (amount * viewportHeight) / PERCENT;
  }
  return value.endsWith(PIXEL_UNIT) ? amount : null;
}
