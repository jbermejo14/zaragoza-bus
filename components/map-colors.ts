/** Colores del mapa, tomados de las variables CSS de `app/globals.css`. */
export interface MapColors {
  stop: string;
  stopBorder: string;
  user: string;
}

const STOP_VARIABLE = '--map-stop-color';
const STOP_BORDER_VARIABLE = '--map-stop-border-color';
const USER_VARIABLE = '--map-user-color';

function readVariable(styles: CSSStyleDeclaration, name: string): string {
  const value = styles.getPropertyValue(name).trim();
  if (value === '') {
    throw new Error(`Falta la variable CSS ${name} en app/globals.css: el mapa no puede pintar sus puntos.`);
  }
  return value;
}

/**
 * Lee los colores del mapa de `:root`. Leaflet los pinta como atributos SVG, que no
 * admiten `var()`, así que hay que resolverlos antes de crear las capas.
 */
export function readMapColors(): MapColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    stop: readVariable(styles, STOP_VARIABLE),
    stopBorder: readVariable(styles, STOP_BORDER_VARIABLE),
    user: readVariable(styles, USER_VARIABLE),
  };
}
