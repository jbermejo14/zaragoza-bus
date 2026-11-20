# ZaraBus — Arquitectura

## 1. Objetivo y alcance

Aplicación web de una sola página, minimalista y responsive, para consultar en tiempo real los tiempos de paso del autobús urbano de Zaragoza.

Hace:

- Buscador protagonista: por número de poste («104») o por nombre de calle («Independencia», «Goya»).
- Filtro rápido por línea (chips: 21, 24, 33, Ci1…), combinable con la búsqueda.
- Vista de poste estilo marquesina: número en insignia roja, nombre, estrella de favorito y lista de líneas con destino, primer bus en grande y segundo en gris.
- Refresco manual y automático cada 30 s (se pausa con la pestaña oculta y refresca al volver).
- Mapa OpenStreetMap estándar (las teselas Positron de CARTO exigen clave de API desde 2026 y se descartaron) con puntos rojos por poste y agrupación (clustering) al alejar. Pulsar un punto abre ese poste.
- Recorrido de una línea dibujado en el mapa (trazado oficial de 2013) al filtrar por esa línea o al pulsar su insignia en la marquesina. No hay posiciones GPS de autobuses: el Ayuntamiento no las publica.
- Pantalla inicial con «Mis paradas» (favoritos en `localStorage`) y botón «Buscar paradas cerca de mí» (geolocalización).
- Indicador «En vivo» / «Demo» en la cabecera. Si la API falla (CORS, red, error del servidor, formato inesperado) se usan datos simulados y se muestra «Demo» con el motivo en el `title`.

No hace:

- Postes de barrios rurales (`rural-*`), tranvía ni rutas.
- Modo oscuro, cuentas, avisos push ni servidor propio.

### Fuente de datos (comprobado el 2026-11-19)

Listado: `GET …/poste-autobus.json?srsname=wgs84&rows=500&start=N`

- Responde `200` con `Access-Control-Allow-Origin: *`.
- **Máximo 500 filas por página** aunque se pidan más: hay que paginar con `start` (0, 500, 1000) hasta reunir `totalCount` (1271 hoy, 983 `tuzsa-*`).
- Formato:

```json
{
  "totalCount": 1271, "start": 0, "rows": 500,
  "result": [
    {
      "id": "tuzsa-666",
      "title": "(666) P. Independencia N.º 25 Líneas: 38, 21",
      "geometry": { "type": "Point", "coordinates": [-0.8826, 41.6497] }
    }
  ]
}
```

- `coordinates` es `[longitud, latitud]`.
- `title` = `(<número>) <nombre> Líneas: <l1>, <l2>`. La lista de líneas puede venir vacía (`"(8105) Plaza San Francisco Líneas: "`).

Tiempos de paso: `GET …/poste-autobus/{id}.json` (p. ej. `tuzsa-104`)

- Hoy responde `400` con `{"status":400,"mensaje":"…NoHttpResponseException…"}` para todos los postes probados: el servicio interno del Ayuntamiento está caído. El modo demo es por tanto imprescindible y el analizador se escribe contra el formato publicado históricamente:

```json
{
  "id": "tuzsa-104",
  "title": "(104) …",
  "destinos": [
    { "linea": "35", "destino": "PARQUE GOYA.", "primero": "4 minutos.", "segundo": "16 minutos." },
    { "linea": "32", "destino": "BOMBARDA,", "primero": "En la parada.", "segundo": "Sin estimacin." }
  ]
}
```

#### Tiempos reales a través del Worker de Ododex (fuente principal)

Como la API municipal de tiempos está caída, la fuente principal es la web pública del operador Avanza, `https://zaragoza-pasobus.avanzagrupo.com/frm_esquemaparadatime.php?poste={número}` (HTML en ISO-8859-1, sin CORS), con respaldo en `https://api.dndzgz.com/services/bus/{número}` (JSON `{"estimates":[{"line":"51","direction":"PABELLN PRNCIPE FELIPE.","estimate":3}]}`, sin CORS y sin tildes). El navegador no puede leer ninguna de las dos, así que el Worker `ododex-zaragoza-bus` de ododex-sitio (`workers/zaragoza-bus.mjs`) hace de proxy en `GET /es/zaragoza-bus/api/poste/{número}` y responde **con el mismo formato histórico del Ayuntamiento**, una fila por autobús:

```json
{ "origen": "avanza", "destinos": [
  { "linea": "25", "destino": "LA CARTUJA", "primero": "14 minutos." },
  { "linea": "23", "destino": "PARQUE VENECIA", "primero": "En la parada." }
] }
```

Así el cliente reutiliza `parseArrivals` (que agrupa por línea y destino y toma los dos menores). Errores: `{ "error": "<mensaje en español>" }` con 400 (número inválido), 404, 405 o 502 (los dos orígenes fallaron). Ese Worker solo existe en producción y en `wrangler dev`; en `next dev` la ruta no existe y el cliente cae a la siguiente fuente.

`data/stops-snapshot.json` es una captura real del listado completo (2026-11-19, mismo formato, coordenadas a 6 decimales). Se usa como listado demo.

## 2. Plataforma

- Next.js 16 con `output: 'export'` (sitio estático) y `--webpack`. React 19, Tailwind CSS 4, `lucide-react`, Leaflet 1.9 + `leaflet.markercluster` 1.5 (sin react-leaflet). Versiones fijadas en `package.json`.
- En este equipo el Control de aplicaciones de Windows bloquea esbuild y los binarios nativos de Tailwind: **no** se usan Vite ni tsx. Tailwind va con su versión WASM (`npm install --force --cpu=wasm32 --os=win32`) y el plugin `postcss-tailwind-windows.cjs`.
- Pruebas: `node --test` con el cargador `tests/support/ts-loader.mjs` (transpila con `typescript`). Una prueba concreta: `node --import ./tests/support/register.mjs --test tests/<fichero>.test.ts`.
- Importaciones internas relativas y sin extensión (`./types`, `../lib/geo`).
- Las pruebas no usan red: `fetch` y `Storage` se inyectan.

## 3. Módulos

Ya escritos (contrato; no modificar sin actualizar este documento):

- `lib/types.ts` — `DataSource`, `Coordinates`, `BusStop`, `Arrival`, `SourcedResult<T>`.
- `lib/config.ts` — URLs, tamaño de página, tiempos, límites, clave de favoritos, mapa.
- `data/stops-snapshot.json` — listado demo.

Orden de implementación: 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → 3.8 → 3.9. Entre paréntesis, dependencias internas.

### 3.1 `lib/text.ts` (ninguna)

Responsabilidad: normalizar texto para comparar búsquedas.

```ts
export function normalizeText(value: string): string;
```

Minúsculas, sin tildes ni diéresis (NFKD, para que `º` pase a `o`, y eliminación de marcas combinantes), `ñ`→`n`, cualquier carácter que no sea letra o dígito pasa a espacio, espacios colapsados y recortados. `"P. Independencia N.º 25"` → `"p independencia n o 25"`; `"  Delicias–Ávila "` → `"delicias avila"`.

### 3.2 `lib/stops-parser.ts` (types, config)

Responsabilidad: convertir una página del listado de la API en `BusStop[]`.

```ts
export class StopsFormatError extends Error {}
export interface StopListPage { stops: BusStop[]; totalCount: number; rawCount: number; }
export function parseStopTitle(title: string): { number: string; name: string; lines: string[] } | null;
export function parseStopListPage(json: unknown): StopListPage;
```

- `parseStopTitle`: expresión `^\((\w+)\)\s*(.*?)\s*Líneas:\s*(.*)$`. Líneas separadas por comas, recortadas, sin vacías. Si no casa, `null`.
- `parseStopListPage`: lanza `StopsFormatError` (mensaje en español que diga qué campo falta) si `json` no es objeto o `result` no es array. `rawCount` = longitud de `result`; `totalCount` = `json.totalCount` si es número, si no `rawCount`. Descarta (sin lanzar) elementos cuyo `id` no empiece por `URBAN_STOP_ID_PREFIX`, cuyo título no case, o sin coordenadas numéricas finitas. Convierte `[lon, lat]` a `{ latitude, longitude }`. Mantiene el orden y elimina `id` duplicados (gana el primero).

Pruebas: título normal, sin líneas, con `Ci1`; página con un `rural-*`, un elemento roto y un duplicado; errores de formato; la instantánea real produce 983 postes.

### 3.3 `lib/stop-search.ts` (types, text, config)

Responsabilidad: buscar y ordenar postes y listar líneas.

```ts
export function searchStops(stops: readonly BusStop[], query: string, line: string | null, limit?: number): BusStop[];
export function listLines(stops: readonly BusStop[]): string[];
export function compareLines(a: string, b: string): number;
export function findStopByNumber(stops: readonly BusStop[], number: string): BusStop | null;
```

- `searchStops`: `limit` por defecto `SEARCH_RESULT_LIMIT`. Si `line` no es `null`, solo postes cuyo `lines` la incluye (comparación sin distinguir mayúsculas). Con consulta vacía (tras recortar) y sin línea → `[]`; con consulta vacía y línea → todos los de esa línea ordenados por número. Consulta solo de dígitos → postes cuyo número empieza por ella: primero el exacto, luego por longitud y número ascendentes. Otra consulta → todos sus tokens normalizados aparecen en `normalizeText(name)` (subcadena); ordena primero los que tienen algún token al principio de una palabra, luego por nombre (`localeCompare` 'es') y número.
- `listLines`: líneas distintas de todos los postes, ordenadas con `compareLines`.
- `compareLines`: primero líneas solo numéricas en orden numérico; después las `Ci…`; después las `C…`; después las `N…`; después el resto; dentro de cada grupo, orden natural (`localeCompare` con `numeric: true`).
- `findStopByNumber`: coincidencia exacta del número, o `null`.

### 3.4 `lib/arrivals-parser.ts` (types)

Responsabilidad: convertir la respuesta de tiempos de paso en `Arrival[]`.

```ts
export class ArrivalsFormatError extends Error {}
export function parseMinutes(value: unknown): number | null;
export function cleanDestination(value: string): string;
export function parseArrivals(json: unknown): Arrival[];
```

- `parseMinutes`: número finito ≥ 0 → redondeado; cadena: si contiene «parada», «llegando» o «inminente» (sin distinguir mayúsculas ni tildes) → `0`; si contiene un entero → ese entero; en otro caso (`"Sin estimacin."`, `""`, `null`) → `null`.
- `cleanDestination`: recorta, quita puntos y comas finales, y pasa a «tipo título» en español: cada palabra con la primera en mayúscula, salvo `de, del, la, las, el, los, y` en minúscula si no son la primera. `"PARQUE GOYA."` → `"Parque Goya"`, `"BOMBARDA,"` → `"Bombarda"`, `"LAS FUENTES"` → `"Las Fuentes"`.
- `parseArrivals`: lanza `ArrivalsFormatError` si no es objeto, si trae `status` numérico ≥ 400 (mensaje con `mensaje` de la API) o si `destinos` no es array. Descarta elementos sin `linea`. Agrupa por (`linea`, destino limpio) uniendo minutos si la API los manda en filas distintas: cada grupo da un `Arrival` con los dos menores minutos no nulos (nulos al final). Orden: por `firstMinutes` ascendente (nulos al final); en empate, por `line` con `localeCompare` y `numeric: true` (no usa `compareLines` para no depender de 3.3).

### 3.5 `lib/geo.ts` (types)

Responsabilidad: distancias y postes cercanos.

```ts
export function distanceMeters(a: Coordinates, b: Coordinates): number; // haversine, radio 6371008.8 m
export interface NearbyStop { stop: BusStop; distanceMeters: number; }
export function nearestStops(stops: readonly BusStop[], origin: Coordinates, limit: number, maxDistanceMeters: number): NearbyStop[];
export function formatDistance(meters: number): string; // "80 m", "450 m", "1,2 km" (< 1000 m: múltiplo de 10)
```

### 3.6 `lib/favorites.ts` (config)

Responsabilidad: leer y escribir los favoritos (lista ordenada de `id` de poste).

```ts
export function loadFavorites(storage: Storage | null): string[];
export function saveFavorites(storage: Storage | null, ids: readonly string[]): void;
export function toggleFavorite(ids: readonly string[], stopId: string): string[];
```

- Clave `FAVORITES_STORAGE_KEY`, valor JSON array de cadenas.
- `loadFavorites`: `null`, ausente, JSON roto, no array o acceso que lanza → `[]` (el error de acceso no se propaga: el navegador puede bloquear el almacenamiento y la app debe seguir). Filtra elementos que no sean cadena y duplicados.
- `saveFavorites`: con `null` no hace nada; si `setItem` lanza (cuota, modo privado), lo deja pasar sin romper y escribe `console.warn` con el motivo.
- `toggleFavorite`: devuelve una lista nueva; añade al final o quita.

### 3.7 `lib/demo-data.ts` (types, stops-parser, arrivals-parser)

Responsabilidad: datos simulados realistas y deterministas.

```ts
export function demoStops(): BusStop[];                       // parseStopListPage(data/stops-snapshot.json).stops
export function demoArrivals(stop: BusStop, now: Date): Arrival[];
export const DEMO_DESTINATIONS: Readonly<Record<string, readonly [string, string]>>; // exportada para las pruebas
```

- `demoArrivals`: para cada línea del poste (si no tiene, devuelve `[]`), uno o dos destinos de la tabla `DEMO_DESTINATIONS` (constante del módulo: línea → par de cabeceras). Elige una dirección por línea con un hash estable de `stop.id + line`. Minutos: pseudoaleatorio determinista a partir de `stop.id`, línea y `Math.floor(now.getTime() / 30000)` (cambia cada 30 s); `firstMinutes` 0–15 (alguna vez 0 = «Llegando»), `secondMinutes` = primero + 6–18; ~1 de cada 12 llegadas con `secondMinutes: null`. Mismo `stop` y misma ventana de 30 s → mismo resultado. Ordenado como `parseArrivals`.
- `DEMO_DESTINATIONS` es ilustrativa (no es oficial). Debe cubrir al menos 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 39, 40, 41, 42, 50–60, Ci1–Ci4, N1–N7 con barrios reales de Zaragoza (24 incluye «Las Fuentes»). Líneas no listadas: `["Plaza España", "<línea> Cabecera"]`.

### 3.8 `lib/bus-source.ts` (types, config, stops-parser, arrivals-parser, demo-data)

Responsabilidad: pedir datos a la API y caer a demo si falla.

```ts
export type FetchFunction = (url: string, init?: RequestInit) => Promise<Response>;
export async function fetchStops(fetchFn: FetchFunction): Promise<SourcedResult<BusStop[]>>;
export async function fetchArrivals(stop: BusStop, fetchFn: FetchFunction, now?: Date): Promise<SourcedResult<Arrival[]>>;
export function describeFailure(error: unknown): string;
```

- Cada petición con `AbortController` y `REQUEST_TIMEOUT_MS`.
- `fetchStops`: pide `${STOP_LIST_URL}&rows=${STOP_LIST_PAGE_SIZE}&start=N` empezando en 0 y sumando `STOP_LIST_PAGE_SIZE` mientras la suma de `rawCount` sea menor que `totalCount` y la página no venga vacía (máximo 10 páginas). Une, quita duplicados. Si cualquier página falla (red, `!response.ok`, JSON inválido, `StopsFormatError`) o el resultado queda vacío → `{ data: demoStops(), source: 'demo', fallbackReason }`.
- `fetchArrivals`: prueba las fuentes en orden y devuelve la primera que funcione: (1) el proxy del Worker, `arrivalsProxyUrl(stop.number)` de config (`/es/zaragoza-bus/api/poste/{número}`, ruta relativa al mismo origen); (2) la API municipal; (3) demo. Las dos primeras se tratan igual (cuerpo JSON leído también en `!ok`, `parseArrivals`). `fallbackReason` de la demo describe el fallo de la API municipal precedido de «Proxy: <motivo>. » si el proxy también falló. Detalle de la API municipal: pide `arrivalsUrl(stop.id)`. Lee el cuerpo como JSON también cuando `!response.ok` (la API manda `status`/`mensaje`); si el cuerpo no es JSON, error con el código HTTP. Cualquier fallo → `{ data: demoArrivals(stop, now), source: 'demo', fallbackReason }`.
- `describeFailure`: mensaje en español: `TypeError` de fetch → «No se pudo conectar con la API (red o CORS bloqueado).»; aborto → «La API no respondió en 8 s.»; errores de formato → «La API devolvió un formato inesperado: …»; HTTP → «La API respondió con error HTTP <código>: <mensaje>.»; otro → su `message`.

### 3.10 `lib/line-route.ts` (types, config, bus-source)

Responsabilidad: obtener y analizar el trazado oficial de una línea para dibujarlo en el mapa.

Fuente (comprobado el 2026-11-19): `GET …/transporte-urbano/linea-autobus/{línea}.json?srsname=wgs84` (`lineRouteUrl` en config). `200` con `Access-Control-Allow-Origin: *`. Datos de 2013 (`lastUpdated`), así que puede haber líneas sin trazado o con recorridos antiguos. Formato:

```json
{
  "title": "Transporte Urbano. Línea 24",
  "lastUpdated": "2013-10-14T08:40:00",
  "result": [
    { "geometry": { "type": "MultiLineString", "coordinates": [[[-0.8602, 41.6509], [-0.8601, 41.6509]]] } },
    { "geometry": { "type": "MultiLineString", "coordinates": [[[-0.8710, 41.6400], [-0.8705, 41.6402]]] } },
    { "title": "Parada P. Echegaray Y Caballero / S. Minguijón", "description": "Poste 651", "geometry": { "type": "Point", "coordinates": [-0.86, 41.65] } }
  ]
}
```

Los elementos `MultiLineString` (normalmente dos, uno por sentido) son el recorrido; los `Point` son postes y se ignoran. Coordenadas `[longitud, latitud]`.

```ts
export class RouteFormatError extends Error {}
export interface LineRoute { line: string; paths: Coordinates[][]; }
export function parseLineRoute(line: string, json: unknown): LineRoute;
export async function fetchLineRoute(line: string, fetchFn: FetchFunction): Promise<LineRoute>;
```

- `parseLineRoute`: lanza `RouteFormatError` si `json` no es objeto, si `result` no es array o si no queda ningún tramo. Acepta geometrías `LineString` (un tramo) y `MultiLineString` (varios). Descarta puntos con coordenadas no numéricas finitas y tramos con menos de 2 puntos.
- `fetchLineRoute`: pide `lineRouteUrl(line)` con el mismo tiempo máximo (`REQUEST_TIMEOUT_MS`) y lanza ante cualquier fallo (red, HTTP no ok, JSON inválido, formato). El mensaje para el usuario se obtiene con `describeFailure` de bus-source, que debe clasificar `RouteFormatError` como formato inesperado. Sin datos demo: si falla, el mapa simplemente no dibuja el trazado. Reutiliza el helper de petición con timeout de bus-source si se exporta sin romper su interfaz; si no, uno propio equivalente.

### 3.9 Interfaz (`lib/use-*.ts`, `components/`, `app/`) (todo lo anterior)

Hooks:

```ts
// lib/use-stops.ts
export function useStops(): { stops: BusStop[]; source: DataSource | null; fallbackReason?: string; loading: boolean };
// lib/use-arrivals.ts — null = ningún poste seleccionado
export function useArrivals(stop: BusStop | null): {
  arrivals: Arrival[]; source: DataSource | null; fallbackReason?: string;
  loading: boolean; updatedAt: Date | null; refresh: () => void;
};
// lib/use-favorites.ts
export function useFavorites(): { favorites: string[]; isFavorite: (id: string) => boolean; toggle: (id: string) => void };
// lib/use-geolocation.ts
export function useGeolocation(): { position: Coordinates | null; status: 'idle' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'error'; request: () => void };
```

- `useArrivals`: pide al cambiar de poste y cada `AUTO_REFRESH_INTERVAL_MS`; se pausa con `document.hidden` y refresca al volver si han pasado más de 30 s. Ignora respuestas de un poste ya no seleccionado.
- Estado de selección en la URL con hash `#poste=104` para poder compartir y para que «atrás» vuelva al inicio.

Componentes (un fichero cada uno en `components/`):

- `ZaraBusApp` — estado raíz (consulta, línea, poste seleccionado, mapa visible en móvil). Composición.
- `AppHeader` — logotipo «ZaraBus» (cuadrado rojo con icono `Bus` + texto) y `SourceBadge`.
- `SourceBadge` — punto verde + «En vivo» o punto ámbar + «Demo» (`title` = motivo). Fuente: la de los tiempos si hay poste seleccionado, si no la del listado.
- `SearchBox` — campo grande (icono `Search`, botón `X` para borrar, `inputMode="search"`, `placeholder` «Nº de poste o calle»). Enter con un número exacto abre el poste.
- `LineFilter` — fila de chips desplazable horizontalmente con las líneas de `listLines`; pulsar activa (rojo relleno) o desactiva.
- `StopResultList` — filas: insignia roja con número, nombre, mini‑insignias de líneas, distancia opcional. Pulsar abre el poste.
- `StopBoard` — marquesina: cabecera con botón volver, insignia roja grande con el número, nombre, estrella (`Star`, rellena en rojo si favorito), botón refrescar (`RefreshCw`, gira mientras carga) y «Actualizado hh:mm:ss». Lista de `ArrivalRow`. Estados: cargando (esqueleto), sin líneas («Este poste no tiene estimaciones ahora mismo»).
- `ArrivalRow` — insignia roja con línea, destino, primero grande en rojo (`Llegando` si 0, `N min`, `—` si null) con `tabular-nums`, segundo en gris pequeño.
- `HomePanel` — «Mis paradas» (lista de favoritos o texto de ayuda) y «Cerca de mí» (botón `LocateFixed` «Buscar paradas cerca de mí», estados de geolocalización con mensajes, lista con distancias).
- `BusMap` + `BusMapLoader` — Leaflet cargado solo en cliente (`next/dynamic` con `ssr: false`). Teselas estándar de OpenStreetMap (`MAP_TILE_URL`), `L.markerClusterGroup` con `circleMarker` rojo (`#DC2626`, radio 6, borde blanco), clusters con estilo propio rojo/blanco (CSS en `globals.css`). Pulsar un punto → seleccionar poste. Al seleccionar un poste, centra en él con `MAP_SELECTED_ZOOM` y lo resalta (radio mayor). Si hay posición del usuario, punto azul.
- Trazado de línea (§3.10): la línea a dibujar es la del filtro activo o, si no hay filtro, la que el usuario pulse en una fila de la marquesina (la insignia de línea de `ArrivalRow` es un botón «Ver recorrido en el mapa»; pulsarla otra vez lo quita). Hook `useLineRoute(line: string | null): { route: LineRoute | null; loading: boolean; error?: string }` con caché en memoria por línea e ignorando respuestas de una línea ya no activa. `BusMap` recibe `route` y la dibuja como polilínea roja (`#DC2626`, grosor 4, opacidad 0.75) en un panel por debajo de los postes, y ajusta la vista al trazado (`fitBounds` con margen) salvo si hay un poste seleccionado. Si falla, aviso discreto en el panel izquierdo («No se pudo cargar el recorrido de la línea N: motivo»). En móvil, activar un recorrido no abre el mapa por sí solo.

## 4. Diseño gráfico

- Paleta: fondo `#FFFFFF`; tarjetas `#F8FAFC` con borde `#E2E8F0`; acento `#DC2626`, hover/activo `#B91C1C`; texto `#0F172A`, secundario `#64748B`. Sin modo oscuro.
- Tipografía: Inter (`next/font/google`) con reserva del sistema; minutos con `tabular-nums`, `text-3xl font-bold`.
- Escritorio (≥ 1024 px): dos columnas. Izquierda 420 px con cabecera, buscador, chips y contenido (inicio, resultados o marquesina) con scroll propio; derecha el mapa a pantalla completa.
- Móvil: una columna. Cabecera, buscador fijo arriba, chips, contenido. Botón «Mapa» / «Lista» en la cabecera alterna el mapa a pantalla completa bajo el buscador.
- Contenido según estado: poste seleccionado → `StopBoard`; consulta o línea activas → `StopResultList` (o «Sin resultados»); si no → `HomePanel`.

## 4b. Integración en ododex.com (`/es/zaragoza-bus`)

Decisiones del titular (2026-11-19): paleta blanca y roja de ZaraBus (sin modo oscuro); cabecera y pie de Ododex con páginas legales; **sin anuncios** (ni `AdSlot` ni `AdSenseScript` ni botón de consentimiento); integrada con `publicada: false` hasta que se valide en producción.

- `next.config.ts`: `basePath: '/es/zaragoza-bus'`. `lib/site.ts` con `SITE_NAME`, `SECTION_NAME = 'Autobús de Zaragoza'`, `BASE_PATH`, `getSiteUrl()`, `absoluteUrl()`, `assetPath()` (copiado de `../es-itv`). Recursos fuera de `next/link` con `assetPath()`.
- Maquetación: cabecera Ododex (logo claro de Ododex + «Autobús de Zaragoza», sin botón de tema) arriba; debajo la app ocupa el alto visible restante (`calc(100dvh - alto de cabecera)`), con su barra propia (buscador, insignia En vivo/Demo, botón Mapa) y el mapa; al hacer scroll, un bloque de texto breve «Sobre este servicio» (fuentes, carácter independiente, tiempos estimados) y el pie Ododex (descripción, atribución OSM y fuentes, enlaces legales, «Otras webs de Ododex»).
- Páginas: `/aviso-legal`, `/privacidad`, `/cookies` (noindex, follow; datos del titular con `lib/legal.ts` y `config/titular.json`, que no va a git), `not-found.tsx` con cabecera y pie, `app/sitemap.ts` (`force-static`, solo la portada). Canonical y OpenGraph con `absoluteUrl`.
- Pruebas copiadas y adaptadas de es-itv: site, legal, legal-pages, network, no-template-leftovers; sin las de AdSlot. Colores: tokens propios en `globals.css` (rojo), nunca hex sueltos en `.tsx`.

## 4c. Rediseño v2 (2026-11-20): maqueta del tranvía, modo oscuro y filtro de línea

Sustituye la maquetación de §4 y §4b (cabecera Ododex arriba + app debajo) y la decisión «sin modo oscuro». Referencia visual y de código: `../zaratram-live` (publicada en `/es/tranvia-zaragoza`), en concreto `components/AppPanel.tsx`, `PanelHeader.tsx`, `use-bottom-sheet.ts`, `bottom-sheet-math.ts`, `TramMap.tsx`/`tram-map-layers.ts`, `app/globals.css` (filtro de teselas oscuras) y su pie de panel con la marca Ododex.

- **Maqueta**: el mapa ocupa toda la ventana (`100dvh`, sin cabecera de sitio). Encima, un panel flotante:
  - Escritorio (≥ 1024 px): tarjeta a la izquierda con margen, esquinas redondeadas, sombra, ancho 400–420 px y alto completo menos márgenes, con scroll propio.
  - Móvil: hoja inferior deslizable (bottom sheet) con asa, tres alturas (recogida mostrando buscador, media, casi completa) como el tranvía; arrastre táctil y con ratón, y el asa accesible con teclado. Sin botón «Mapa/Lista»: el mapa siempre está detrás.
  - Contenido del panel, de arriba abajo: cabecera del panel (icono rojo de bus + «Autobús de Zaragoza» + subtítulo «Tiempos de paso en tiempo real», insignia En vivo/Demo, botón de tema), buscador, chips de línea, contenido (inicio / resultados / marquesina), «Sobre este servicio» y, al final, el pie Ododex dentro del panel (logo de Ododex según tema, descripción, fuentes y atribución OSM, enlaces legales, «Otras webs de Ododex»).
  - Las páginas legales y la 404 mantienen cabecera y pie Ododex normales (con botón de tema).
- **Tema claro/oscuro**: `data-theme="light"|"dark"` en `<html>`, script en `<head>` antes de pintar que lee `localStorage['ododex-theme']` y, si no hay, `prefers-color-scheme` (como las demás webs de la red: misma clave para que el tema se comparta en ododex.com). Botón sol/luna con `aria-label` que alterna y guarda. Tokens de color redefinidos para `[data-theme="dark"]` (fondo de panel oscuro tipo `#0F172A`/`#1E293B`, texto claro, bordes oscuros); el rojo de acento se mantiene (ajústalo, p. ej. `#EF4444`, si hace falta contraste AA sobre fondo oscuro). Contraste AA en ambos temas. Logos de Ododex claro/oscuro según tema.
- **Mapa**: teselas OSM. En tema oscuro, `.leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9) saturate(0.3); }` como el tranvía; en tema claro, teselas normales. Postes, clusters, selección y recorrido con colores leídos de variables CSS que cambian con el tema (los marcadores se recolorean al cambiar de tema sin recrear el mapa). Controles de zoom arriba a la derecha. En escritorio, encuadres (`fitBounds`, `setView`) con `paddingTopLeft` igual al ancho del panel para que nada quede tapado; en móvil, con relleno inferior igual a la altura de la hoja.
- **Línea seleccionada** (chip activo): se muestra solo esa línea.
  - Mapa: solo los postes cuyo `lines` incluye la línea (el resto se quita de la capa de clusters) y su recorrido.
  - Lista: solo sus postes (ya lo hace `searchStops`).
  - Marquesina: solo las llegadas de esa línea; si el poste no tiene esa línea o no hay llegadas de ella, mensaje «La línea N no tiene llegadas previstas en este poste» con un botón «Ver todas las líneas» que quita el filtro.
  - Al abrir un poste con filtro activo el filtro se mantiene (ya no se cierra el poste al pulsar un chip: pulsar un chip con poste abierto filtra su marquesina).
  - Lógica pura del filtrado (postes visibles, llegadas visibles) en `lib/line-filter.ts` con pruebas.

## 5. Criterios de aceptación

- 3.1–3.8: pruebas en `tests/<módulo>.test.ts` que cubran la interfaz pública y los casos límite descritos. Sin red.
- 3.9: `npm run typecheck` y `npm run build` sin errores; verificación en navegador (búsqueda «104» e «Independencia», filtro de línea, marquesina con refresco, favorito persistente tras recargar, mapa con clusters, indicador Demo con la API caída) en escritorio y a 375 px.

## 4d. Autobuses en el mapa con GPS de Avanza (2026-11-20)

Añade la posición real de los autobuses que se acercan al poste abierto. Se hace por partes: primero el Worker y el módulo de datos (ficheros nuevos, sin tocar la interfaz del rediseño v2); el dibujo en el mapa, cuando el v2 esté commiteado.

### Fuente (comprobado el 2026-11-20)

`POST https://gps.avanzabus.com/index.php/zaragoza/fRefrescaEmpresaExternos`, cuerpo `poste=<número>&coche=0` (`application/x-www-form-urlencoded`; `coche=0` = todos). Es el endpoint, no documentado, que usa la web del operador. Sin CORS. Respuesta JSON (servida como `text/html`):

```json
{
  "tablatiempos": "<html con los mismos coches y minutos>",
  "maquinas": {
    "0": { "coordenadas": { "0": { "LAT": 41.627026, "LON": -0.907306 } }, "icon": "https://gps.avanzabus.com/img/bus_rojo.png", "title": "P. Reyes de Aragón n.º 24", "info": "P. Reyes de Aragón n.º 24" },
    "1": { "coordenadas": { "0": { "LAT": 41.6269, "LON": -0.9073 } }, "icon": "https://gps.avanzabus.com/img/bus.png", "title": "058 4709",
           "info": "<table border=\"0\"><tr><td class=\"td_info\">Bus</td>…</tr><tr><td class=\"td_info2\">&nbsp4709</td><td class=\"td_info2\">058->FUENTE JUNQUERA</td><td class=\"td_info2\">0 min.</td><td class=\"td_info2\">0 kms.</td></tr></table>" }
  }
}
```

- La entrada con `icon` `bus_rojo.png` es el propio poste. Las demás son autobuses: una por coche y posición; el mismo coche puede aparecer en varias entradas si pasará varias veces (líneas circulares).
- Cada fila `td_info2` de `info` tiene 4 celdas: coche (con `&nbsp`), `<línea>-><destino>` (línea con ceros a la izquierda: `058`, `039`; puede no ser numérica, p. ej. `CI2`), `<n> min.` y `<n> kms.`.
- Sin autobuses, o con un poste que no existe, responde `{"tablatiempos":""}` sin `maquinas`. No se distinguen.
- A veces tarda varios segundos.

### Worker `ododex-zaragoza-bus` (`../ododex-sitio/workers/zaragoza-bus.mjs`): ruta nueva

`GET /es/zaragoza-bus/api/gps/{poste}` con poste `/^\d{1,5}$/` (mismo patrón que `/api/poste/`). Respuesta 200:

```json
{
  "poste": { "latitud": 41.627026, "longitud": -0.907306 },
  "autobuses": [
    { "coche": "4709", "linea": "58", "destino": "FUENTE JUNQUERA", "latitud": 41.6269, "longitud": -0.9073,
      "llegadas": [ { "minutos": 21, "km": 4 }, { "minutos": 51, "km": 10 } ] }
  ]
}
```

- `poste`: coordenadas de la entrada del poste, o `null` si no viene.
- `autobuses`: agrupados por coche (y línea+destino), con las llegadas ordenadas por minutos. Línea sin ceros a la izquierda si es numérica (`058` → `58`); si no, tal cual en mayúsculas. Destino con espacios normalizados.
- Sin `maquinas` → `{ "poste": null, "autobuses": [] }` con 200.
- Formato inesperado (no es objeto, `maquinas` no es objeto, una entrada de autobús sin coordenadas numéricas o con una fila que no tiene las 4 celdas esperadas) → 502. Mejor fallar que perder autobuses en silencio.
- Petición al origen: POST con el cuerpo de arriba, `User-Agent: Ododex/1.0 (+https://ododex.com/es/zaragoza-bus)`, sin reenviar cabeceras del usuario, `redirect: "manual"`, tiempo máximo 7 s (el GPS de Avanza tarda de 3 a 6 s; queda por debajo de los 8 s del cliente).
- Caché: los POST no los cachea `cf.cacheTtl`, así que se usa la Cache API (`caches.default`) con una clave GET sintética por poste y 15 s de vida, para que muchos usuarios mirando el mismo poste hagan una sola petición a Avanza. Si `caches` no existe (pruebas), se omite.
- Cabeceras y errores como `/api/poste/` (400, 404, 405, 502; `no-store` en errores; `public, max-age=15` en 200; `x-robots-tag: noindex`).
- La ruta nueva no añade exports: todo es privado. El módulo exporta `default` y, heredadas y ya desplegadas, las funciones `extraerFilasAvanza` y `mapearDndzgz` (workerd rechaza exports que no son funciones o manejadores, como las constantes).

### Cliente: `lib/bus-vehicles.ts` (types, config, bus-source)

```ts
export interface VehicleArrival { minutes: number; km: number; }
export interface BusVehicle { vehicle: string; line: string; destination: string; position: Coordinates; arrivals: VehicleArrival[]; }
export interface StopVehicles { stopPosition: Coordinates | null; vehicles: BusVehicle[]; }
export class VehiclesFormatError extends Error {}
export function parseStopVehicles(json: unknown): StopVehicles;
export async function fetchStopVehicles(stopNumber: string, fetchFn: FetchFunction): Promise<StopVehicles>;
```

- `parseStopVehicles`: valida el JSON del Worker; `VehiclesFormatError` (con mensaje que diga qué campo falla) si no es objeto, si `autobuses` no es array, o si un autobús no tiene coche, línea, coordenadas finitas o `llegadas` válidas.
- `fetchStopVehicles`: `requestJson(fetchFn, vehiclesProxyUrl(stopNumber))` de bus-source y `parseStopVehicles`. Lanza ante cualquier fallo: sin datos demo (si falla, el mapa simplemente no dibuja autobuses). `describeFailure` de bus-source debe clasificar `VehiclesFormatError` como formato inesperado.
- `lib/config.ts`: `VEHICLES_PROXY_PREFIX = '/es/zaragoza-bus/api/gps/'` y `vehiclesProxyUrl(stopNumber)`.

### Interfaz (pendiente del v2)

- Con un poste abierto, se piden sus autobuses junto con los tiempos (mismo refresco de 30 s y misma pausa con la pestaña oculta) y se dibujan en el mapa: icono de bus con el número de línea, tooltip «Línea 58 → Fuente Junquera · coche 4709 · 21 min (4 km)». Con filtro de línea activo, solo los de esa línea.
- Los autobuses van en un panel de Leaflet propio (`zb-vehicles`, zIndex 640): por encima de postes y grupos (600) y por debajo de los tooltips (650).
- Se quitan del mapa al cerrar el poste. Si la petición falla, no se dibuja nada y no se muestra error (los tiempos siguen siendo la información principal).
- Legales («Privacidad» y «Sobre este servicio»): las posiciones salen del sistema público de Avanza consultado por nuestro servidor, sin datos del usuario.

### Criterios de aceptación

- Worker: pruebas con `fetch` simulado (cuerpo real de ejemplo con dos entradas del mismo coche, fila de línea no numérica, respuesta vacía `{"tablatiempos":""}`, formato roto → 502, poste inválido → 400, timeout, cabeceras, que la petición es POST con el cuerpo y User-Agent correctos y sin cabeceras del usuario, y uso de la caché cuando `caches` existe).
- `lib/bus-vehicles.ts`: `parseStopVehicles` con casos válidos y cada error; `fetchStopVehicles` con fetch simulado (éxito, HTTP 502 con `{error}`, formato roto).
- Comprobación manual contra el origen real con el Worker ejecutado en Node antes de desplegar.
