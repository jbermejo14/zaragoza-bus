// Tipos de dominio compartidos por toda la aplicación. Contrato: ver ARCHITECTURE.md §3.

/** Origen de unos datos: API municipal real o datos simulados. */
export type DataSource = 'live' | 'demo';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Poste (parada física) de autobús urbano. */
export interface BusStop {
  /** Identificador de la API, p. ej. "tuzsa-104". */
  id: string;
  /** Número rotulado en el poste, p. ej. "104". */
  number: string;
  /** Nombre de la parada sin número ni líneas, p. ej. "P. Independencia N.º 25". */
  name: string;
  /** Líneas que paran, en el orden de la API, p. ej. ["38", "21"]. Puede estar vacío. */
  lines: string[];
  coordinates: Coordinates;
}

/** Próximos pasos de una línea con un destino concreto en un poste. */
export interface Arrival {
  line: string;
  destination: string;
  /** Minutos hasta el primer autobús. 0 = llegando. null = sin estimación. */
  firstMinutes: number | null;
  /** Minutos hasta el segundo autobús. null = sin estimación. */
  secondMinutes: number | null;
}

/** Resultado de una consulta con su origen y, si es demo por fallo, el motivo. */
export interface SourcedResult<T> {
  data: T;
  source: DataSource;
  /** Motivo legible de la caída a demo. Ausente cuando source es 'live'. */
  fallbackReason?: string;
}
