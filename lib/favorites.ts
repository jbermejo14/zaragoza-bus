import { FAVORITES_STORAGE_KEY } from './config';

function readStoredIds(storage: Storage): unknown {
  const raw = storage.getItem(FAVORITES_STORAGE_KEY);
  return raw === null ? [] : JSON.parse(raw);
}

/** Lee los favoritos. Ante cualquier fallo de acceso o formato devuelve una lista vacía. */
export function loadFavorites(storage: Storage | null): string[] {
  if (storage === null) {
    return [];
  }
  try {
    const parsed = readStoredIds(storage);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const strings = parsed.filter((item): item is string => typeof item === 'string');
    return [...new Set(strings)];
  } catch {
    // El navegador puede bloquear el almacenamiento o el JSON estar roto: la app sigue sin favoritos.
    return [];
  }
}

/** Guarda los favoritos. Si el almacenamiento falla (cuota, modo privado) avisa por consola y continúa. */
export function saveFavorites(storage: Storage | null, ids: readonly string[]): void {
  if (storage === null) {
    return;
  }
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`No se pudieron guardar los favoritos: ${reason}`);
  }
}

/** Devuelve una lista nueva con el poste añadido al final o quitado si ya estaba. */
export function toggleFavorite(ids: readonly string[], stopId: string): string[] {
  return ids.includes(stopId) ? ids.filter((id) => id !== stopId) : [...ids, stopId];
}
