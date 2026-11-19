import type { Arrival, BusStop, SourcedResult } from './types';
import { REQUEST_TIMEOUT_MS, STOP_LIST_PAGE_SIZE, STOP_LIST_URL, arrivalsProxyUrl, arrivalsUrl } from './config';
import { FormatError } from './format-error';
import { parseStopListPage } from './stops-parser';
import { parseArrivals } from './arrivals-parser';
import { demoArrivals, demoStops } from './demo-data';

export type FetchFunction = (url: string, init?: RequestInit) => Promise<Response>;

const MAX_STOP_PAGES = 10;
const MS_PER_SECOND = 1000;
const NON_JSON_MESSAGE = 'el cuerpo de la respuesta no es JSON';
const NO_DETAIL_MESSAGE = 'sin detalle';
const TRAILING_PERIOD = /\.$/;

/** Respuesta HTTP no satisfactoria o ilegible, con el mensaje que mande la API si lo hay. */
class HttpStatusError extends Error {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

/** Respuesta correcta (200) cuyo cuerpo no se puede interpretar, por ejemplo porque no es JSON. */
class ResponseFormatError extends FormatError {}

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';
}

/** Describe en español por qué falló una petición, para mostrarlo en el indicador «Demo». */
export function describeFailure(error: unknown): string {
  if (isAbortError(error)) return `La API no respondió en ${REQUEST_TIMEOUT_MS / MS_PER_SECOND} s.`;
  if (error instanceof TypeError) return 'No se pudo conectar con la API (red o CORS bloqueado).';
  if (error instanceof FormatError) {
    return `La API devolvió un formato inesperado: ${error.message}`;
  }
  if (error instanceof HttpStatusError) {
    return `La API respondió con error HTTP ${error.status}: ${error.message.replace(TRAILING_PERIOD, '')}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

function apiMessage(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const { mensaje, error } = body as { mensaje?: unknown; error?: unknown };
  // La API municipal usa `mensaje`; el proxy de Ododex usa `error`.
  if (typeof mensaje === 'string') return mensaje;
  return typeof error === 'string' ? error : null;
}

/** Lee el cuerpo como JSON; devuelve `undefined` (que nunca es JSON válido) si no lo es. */
async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    // Un aborto por tiempo límite durante la lectura debe describirse como timeout.
    if (isAbortError(error)) throw error;
    // Cualquier otro fallo es un cuerpo no JSON: el llamador decide según el código HTTP.
    return undefined;
  }
}

/** Pide una URL con tiempo límite y devuelve el JSON; el temporizador se limpia siempre. */
export async function requestJson(fetchFn: FetchFunction, url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchFn(url, { signal: controller.signal });
    const body = await readJsonBody(response);
    if (!response.ok) {
      // En HTTP/2 `statusText` llega vacío, de ahí el último respaldo.
      throw new HttpStatusError(response.status, apiMessage(body) || response.statusText || NO_DETAIL_MESSAGE);
    }
    if (body === undefined) throw new ResponseFormatError(NON_JSON_MESSAGE);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAllStops(fetchFn: FetchFunction): Promise<BusStop[]> {
  const stops = new Map<string, BusStop>();
  let fetchedRows = 0;
  for (let page = 0; page < MAX_STOP_PAGES; page += 1) {
    const start = page * STOP_LIST_PAGE_SIZE;
    const json = await requestJson(fetchFn, `${STOP_LIST_URL}&rows=${STOP_LIST_PAGE_SIZE}&start=${start}`);
    const parsed = parseStopListPage(json);
    for (const stop of parsed.stops) {
      if (!stops.has(stop.id)) stops.set(stop.id, stop);
    }
    fetchedRows += parsed.rawCount;
    if (parsed.rawCount === 0 || fetchedRows >= parsed.totalCount) break;
  }
  return [...stops.values()];
}

/** Descarga el listado completo de postes; si algo falla, usa el listado demo con el motivo. */
export async function fetchStops(fetchFn: FetchFunction): Promise<SourcedResult<BusStop[]>> {
  try {
    const stops = await fetchAllStops(fetchFn);
    if (stops.length === 0) {
      return { data: demoStops(), source: 'demo', fallbackReason: 'La API no devolvió ningún poste urbano.' };
    }
    return { data: stops, source: 'live' };
  } catch (error) {
    return { data: demoStops(), source: 'demo', fallbackReason: describeFailure(error) };
  }
}

async function requestArrivals(fetchFn: FetchFunction, url: string): Promise<Arrival[]> {
  return parseArrivals(await requestJson(fetchFn, url));
}

/**
 * Pide los tiempos de paso de un poste. Orden de fuentes: proxy de Ododex, API municipal y,
 * si ambas fallan, llegadas simuladas con el motivo de cada fallo.
 */
export async function fetchArrivals(
  stop: BusStop,
  fetchFn: FetchFunction,
  now: Date = new Date(),
): Promise<SourcedResult<Arrival[]>> {
  let proxyFailure: unknown;
  try {
    return { data: await requestArrivals(fetchFn, arrivalsProxyUrl(stop.number)), source: 'live' };
  } catch (error) {
    // Se prueba la API municipal; el motivo del proxy se conserva para el indicador «Demo».
    proxyFailure = error;
  }
  try {
    return { data: await requestArrivals(fetchFn, arrivalsUrl(stop.id)), source: 'live' };
  } catch (error) {
    const fallbackReason = `Proxy: ${describeFailure(proxyFailure)} API municipal: ${describeFailure(error)}`;
    return { data: demoArrivals(stop, now), source: 'demo', fallbackReason };
  }
}
