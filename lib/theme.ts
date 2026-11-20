/** Clave de `localStorage` compartida con el resto de webs de Ododex: el tema se mantiene en toda la red. */
export const THEME_STORAGE_KEY = 'ododex-theme';

/** Atributo de `<html>` que activa los tokens de color de cada tema en `app/globals.css`. */
export const THEME_ATTRIBUTE = 'data-theme';

export type Theme = 'light' | 'dark';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

/**
 * Script que se ejecuta en `<head>` antes de pintar para evitar el parpadeo de tema. Prioridad:
 * preferencia guardada, preferencia del sistema y, por último, claro. El try/catch cubre un
 * almacenamiento bloqueado (modo privado, cookies desactivadas).
 */
export const THEME_INIT_SCRIPT = `
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (saved === 'light' || saved === 'dark') {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia('${DARK_SCHEME_QUERY}').matches) {
      theme = 'dark';
    }
  } catch (error) {
    theme = 'light';
  }
  document.documentElement.setAttribute('${THEME_ATTRIBUTE}', theme);
})();
`;

/** Parte de `HTMLElement` que usa este módulo; permite probarlo sin navegador. */
export interface ThemeRoot {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
}

/** Tema activo según el atributo de `<html>`; sin atributo válido se considera claro. */
export function readTheme(root: ThemeRoot): Theme {
  return root.getAttribute(THEME_ATTRIBUTE) === 'dark' ? 'dark' : 'light';
}

/** El tema contrario al dado. */
export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/**
 * Alterna el tema de `<html>` y lo guarda. Si el almacenamiento falla (cuota, modo privado)
 * el tema cambia igualmente y solo dura la visita; se avisa en la consola.
 */
export function toggleTheme(root: ThemeRoot, storage: Storage | null): Theme {
  const next = oppositeTheme(readTheme(root));
  root.setAttribute(THEME_ATTRIBUTE, next);
  try {
    storage?.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    console.warn(`No se pudo guardar el tema (${THEME_STORAGE_KEY}); solo durará esta visita.`, error);
  }
  return next;
}
