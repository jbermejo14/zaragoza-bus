// Selección de poste en el hash de la URL (#poste=104), para compartir enlaces y usar «atrás».

const STOP_HASH_PREFIX = '#poste=';
const STOP_NUMBER_PATTERN = /^\w+$/;

/** Número de poste contenido en un hash, o null si no hay ninguno válido. */
export function parseStopHash(hash: string): string | null {
  if (!hash.startsWith(STOP_HASH_PREFIX)) {
    return null;
  }
  const number = hash.slice(STOP_HASH_PREFIX.length);
  return STOP_NUMBER_PATTERN.test(number) ? number : null;
}

/** Hash para un número de poste; con null, el hash vacío (inicio). */
export function buildStopHash(number: string | null): string {
  return number === null ? '' : `${STOP_HASH_PREFIX}${number}`;
}

/** Marca que la app guarda en `history.state` al abrir un poste, para saber que «atrás» vuelve al inicio. */
export const STOP_HISTORY_MARKER = { zarabusStop: true } as const;

/** True si la entrada del historial la creó la propia app al seleccionar un poste. */
export function isAppStopHistoryState(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'zarabusStop' in state && state.zarabusStop === true;
}
