'use client';

import { Moon, Sun } from 'lucide-react';
import { toggleTheme } from '../lib/theme';

const THEME_ICON_SIZE = 18;
const TOGGLE_LABEL = 'Cambiar entre modo claro y oscuro';

/**
 * `localStorage` del navegador, o null si el acceso está bloqueado
 * (el propio acceso a la propiedad puede lanzar SecurityError).
 */
function themeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    // Almacenamiento bloqueado: el tema cambia igualmente, pero solo durante la visita.
    return null;
  }
}

/** Botón sol/luna que alterna el tema y lo guarda. El icono lo elige el CSS según `data-theme`. */
export default function ThemeToggle() {
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={TOGGLE_LABEL}
      title={TOGGLE_LABEL}
      onClick={() => toggleTheme(document.documentElement, themeStorage())}
    >
      <Moon className="theme-icon-moon" size={THEME_ICON_SIZE} aria-hidden="true" />
      <Sun className="theme-icon-sun" size={THEME_ICON_SIZE} aria-hidden="true" />
    </button>
  );
}
