import { existsSync, readFileSync } from 'node:fs';

/** Variable de entorno con la ruta absoluta de `red-enlaces.json` (la fija ododex-sitio al compilar). */
export const NETWORK_ENV_VAR = 'ODODEX_RED_ENLACES';

const NETWORK_SUPPORTED_VERSION = 1;

export interface NetworkSection {
  ruta: string;
  nombre: string;
  descripcion: string;
}

interface NetworkData {
  version: number;
  secciones: NetworkSection[];
}

// Caché por ruta de fichero: el JSON pesa MB y se consulta una vez por página.
const networkCache = new Map<string, NetworkData>();

function networkParse(file: string): NetworkData {
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${file}: el JSON de la red de enlaces no es válido (${reason}). Regénéralo con scripts/generar-red.mjs de ododex-sitio.`);
  }
  const record = data as Partial<NetworkData> | null;
  if (typeof record !== 'object' || record === null || record.version !== NETWORK_SUPPORTED_VERSION) {
    throw new Error(`${file}: versión de red de enlaces no soportada (se esperaba version ${NETWORK_SUPPORTED_VERSION}).`);
  }
  return { version: record.version, secciones: record.secciones ?? [] };
}

/** Datos de la red, o `null` si la variable no está definida o el fichero no existe (desarrollo local). Lanza Error si el JSON es inválido o su versión no es 1. */
function networkLoad(): NetworkData | null {
  const file = process.env[NETWORK_ENV_VAR];
  if (!file || !existsSync(file)) return null;
  const cached = networkCache.get(file);
  if (cached) return cached;
  const data = networkParse(file);
  networkCache.set(file, data);
  return data;
}

/** Secciones de la red salvo la propia (`ownRoute`, p. ej. `/es/zaragoza-bus`). `null` si no hay red. */
export function getNetworkSections(ownRoute: string): NetworkSection[] | null {
  const data = networkLoad();
  return data ? data.secciones.filter(section => section.ruta !== ownRoute) : null;
}
