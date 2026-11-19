/** Línea cuyo recorrido se dibuja: el filtro activo manda sobre la insignia pulsada en la marquesina. */
export function pickRouteLine(lineFilter: string | null, highlightedLine: string | null): string | null {
  return lineFilter ?? highlightedLine;
}

/** Nueva línea resaltada al pulsar una insignia: pulsar la ya activa la quita. */
export function toggleHighlightedLine(current: string | null, pressed: string): string | null {
  return current === pressed ? null : pressed;
}
