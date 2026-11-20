'use client';

import { useEffect, useState } from 'react';
import { THEME_ATTRIBUTE } from '../lib/theme';
import { readMapColors, type MapColors } from './map-colors';

/** Colores del mapa del tema activo; se actualizan al cambiar `data-theme` sin recrear el mapa. */
export function useMapColors(): MapColors {
  const [colors, setColors] = useState(readMapColors);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readMapColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
    return () => observer.disconnect();
  }, []);

  return colors;
}
