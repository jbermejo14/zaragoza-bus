'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadFavorites, saveFavorites, toggleFavorite } from './favorites';

/**
 * `localStorage` del navegador, o null si el acceso está bloqueado
 * (el propio acceso a la propiedad puede lanzar SecurityError).
 */
function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Almacenamiento bloqueado: la app funciona igual, sin recordar los favoritos.
    return null;
  }
}

/** Favoritos persistentes. Se leen tras montar para no desajustar la hidratación. */
export function useFavorites(): { favorites: string[]; isFavorite: (id: string) => boolean; toggle: (id: string) => void } {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites(browserStorage()));
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setFavorites((current) => {
        const next = toggleFavorite(current, id);
        saveFavorites(browserStorage(), next);
        return next;
      });
    },
    [],
  );
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, isFavorite, toggle };
}
