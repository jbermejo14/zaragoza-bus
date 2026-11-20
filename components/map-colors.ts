/** Colores del mapa, tomados de las variables CSS de `app/globals.css` (cambian con el tema). */
export interface MapColors {
  stop: string;
  stopBorder: string;
  selected: string;
  route: string;
  user: string;
}

const STOP_VARIABLE = '--map-stop-color';
const STOP_BORDER_VARIABLE = '--map-stop-border-color';
const SELECTED_VARIABLE = '--map-selected-color';
const ROUTE_VARIABLE = '--map-route-color';
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
 * admiten `var()`, así que hay que resolverlos antes de crear las capas y volver a leerlos
 * cuando cambia el tema.
 */
export function readMapColors(): MapColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    stop: readVariable(styles, STOP_VARIABLE),
    stopBorder: readVariable(styles, STOP_BORDER_VARIABLE),
    selected: readVariable(styles, SELECTED_VARIABLE),
    route: readVariable(styles, ROUTE_VARIABLE),
    user: readVariable(styles, USER_VARIABLE),
  };
}
