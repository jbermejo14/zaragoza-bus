# ZaraBus — Autobús de Zaragoza en tiempo real

Web estática (Next.js 16, exportación estática) para consultar cuándo llega el próximo autobús urbano de Zaragoza a cada poste. Se publica como sección `/es/zaragoza-bus` de ododex.com desde `../ododex-sitio`. El diseño y los contratos de cada módulo están en [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Qué hace

- Buscador por número de poste («104») o por calle («Goya»), con filtro rápido por línea.
- Marquesina del poste: líneas, destino, primer y segundo autobús; refresco manual y automático cada 30 s.
- Favoritos («Mis paradas», en `localStorage`) y «Cerca de mí» con la geolocalización del navegador.
- Mapa OpenStreetMap con los 983 postes urbanos agrupados y el recorrido oficial de una línea.
- Indicador «En vivo» / «Demo» en la cabecera del panel.
- Maqueta como `/es/tranvia-zaragoza`: mapa a pantalla completa con panel flotante (hoja deslizable en móvil); tema claro u oscuro según el sistema, con botón para cambiarlo (clave `ododex-theme`, compartida con las demás webs de Ododex).
- Al elegir una línea, el mapa, la lista y la marquesina muestran solo esa línea.

## Fuentes de datos

| Dato | Fuente | Notas |
|---|---|---|
| Postes | API de datos abiertos del Ayuntamiento (`poste-autobus.json`, paginada de 500 en 500) | Si falla, `data/stops-snapshot.json` (captura del 2026-11-19) |
| Tiempos de paso | 1) Worker de Ododex `/es/zaragoza-bus/api/poste/{n}` (lee la web de Avanza y, si falla, DNDzgz); 2) API municipal `poste-autobus/{id}.json`; 3) datos simulados | La API municipal de tiempos respondía 400 el 2026-11-19 |
| Recorridos | API municipal `linea-autobus/{línea}.json` | Geometría publicada en 2013 |

El proxy vive en `../ododex-sitio/workers/zaragoza-bus.mjs`: en `npm run dev` no existe y la app pasa a la siguiente fuente.

## Instalación

Requisitos: Node.js 20 o superior. En este equipo el Control de aplicaciones de Windows bloquea los binarios nativos de esbuild, SWC y Tailwind, por eso:

```bash
npm install --force --cpu=wasm32 --os=win32
```

Esa instalación omite `lightningcss-win32-x64-msvc`, que `next build` necesita. Instálalo sin tocar `package.json`, con la misma versión que `lightningcss` (hoy 1.32.0):

```bash
npm install --no-save --force lightningcss-win32-x64-msvc@1.32.0
```

Copia `config/titular.example.json` a `config/titular.json` y rellena los datos del aviso legal (este fichero no va a git).

## Uso

```bash
npm run dev        # servidor de desarrollo (http://localhost:3000/es/zaragoza-bus)
npm test           # pruebas (node --test con cargador TypeScript propio; sin red)
npm run typecheck  # comprobación de tipos
npm run build      # exportación estática en out/
```

Para publicar no se usa `npm run build` aquí: se compila desde `../ododex-sitio` (`node scripts/construir.mjs --solo /es/zaragoza-bus`), que pasa las variables de producción y ensambla `dist-zaragoza-bus/`.

## Configuración

| Variable | Qué hace | Por defecto |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Origen del sitio para canonical, OpenGraph y sitemap | `http://localhost:3000` |
| `ODODEX_RED_ENLACES` | Ruta de `red-enlaces.json` de ododex-sitio para el bloque «Otras webs de Ododex» del pie | sin bloque |

Constantes de la app (URLs, tiempos de refresco, límites, mapa) en `lib/config.ts`.

## Límites conocidos

- Los tiempos dependen del HTML público de Avanza: si cambia su maquetación, el Worker cae a DNDzgz y, si este también falla, a la API municipal o a datos simulados.
- No hay posiciones GPS de los autobuses: el Ayuntamiento no las publica.
- Los recorridos son de 2013 y pueden no reflejar desvíos actuales.
- Sin anuncios por decisión del titular.
