// Worker proxy de tiempos reales y GPS del autobús urbano de Zaragoza para GitHub Pages.
// Origen principal: Avanza (HTML en ISO-8859-1 y GPS JSON); respaldo de tiempos: DNDzgz.

const URL_AVANZA = "https://zaragoza-pasobus.avanzagrupo.com/frm_esquemaparadatime.php?poste=";
const URL_DNDZGZ = "https://api.dndzgz.com/services/bus/";
const PREFIJO_API = "/api/";
const PREFIJO_RUTA_POSTE = `${PREFIJO_API}poste/`;
const PREFIJO_RUTA_GPS = `${PREFIJO_API}gps/`;
const PREFIJO_RUTA_GPS_LINEA = `${PREFIJO_API}gps-linea/`;
const URL_GPS_AVANZA = "https://gps.avanzabus.com/index.php/zaragoza/fRefrescaEmpresaExternos";
const USER_AGENT_GPS = "ZaragozaBus/1.0 (+https://jbermejo14.github.io/zaragoza-bus)";
const TIPO_FORMULARIO = "application/x-www-form-urlencoded";
const METODO_ORIGEN_GPS = "POST";
const URL_CLAVE_CACHE_GPS = "https://zaragoza-bus-api.internal/cache/gps/";
const PATRON_POSTE = /^\d{1,5}$/;
const PATRON_LINEA = /^[A-Za-z0-9]{1,4}$/;
const PARAMETRO_POSTES = "postes";
const SEPARADOR_POSTES = ",";
const MAXIMO_POSTES_LINEA = 10;
const TIEMPO_MAXIMO_MS = 5000;
const TIEMPO_MAXIMO_GPS_MS = 25000;
const TIEMPO_MAXIMO_GPS_LINEA_MS = 25000;
const MAXIMO_CONSULTAS_SIMULTANEAS_GPS_LINEA = 4;
const TTL_CACHE_ORIGEN_S = 20;
const OPCIONES_ORIGEN_TIEMPOS = { cf: { cacheTtl: TTL_CACHE_ORIGEN_S, cacheEverything: true } };
const MAX_AGE_RESPUESTA_S = 15;
const METODO_PERMITIDO = "GET";
const METODO_PREFLIGHT = "OPTIONS";
const ORIGEN_AVANZA = "avanza";
const ORIGEN_DNDZGZ = "dndzgz";

const CODIFICACION_AVANZA = "iso-8859-1";
const MARCA_CABECERA_POSTE = "POSTE:";
const PATRON_FILA = /<tr>\s*<td class="digital">([\s\S]*?)<\/td>\s*<td class="digital">([\s\S]*?)<\/td>\s*<td class="digital">([\s\S]*?)<\/td>/g;
const PATRON_ENTIDAD = /&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi;
const ENTIDADES_BASICAS = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const BASE_DECIMAL = 10;
const BASE_HEXADECIMAL = 16;
const MAXIMO_PUNTO_DE_CODIGO = 0x10ffff;

const CABECERAS_CORS = {
  "access-control-allow-origin": "https://jbermejo14.github.io",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-max-age": "86400",
  vary: "Origin",
};
const TIPO_JSON = "application/json; charset=utf-8";
const CABECERAS_ERROR = { ...CABECERAS_CORS, "content-type": TIPO_JSON, "x-robots-tag": "noindex", "cache-control": "no-store" };
const CABECERAS_OK = { ...CABECERAS_ERROR, "cache-control": `public, max-age=${MAX_AGE_RESPUESTA_S}` };

const ESTADO_OK = 200;
const ESTADO_SIN_CONTENIDO = 204;
const ESTADO_PETICION_INVALIDA = 400;
const ESTADO_NO_ENCONTRADO = 404;
const ESTADO_METODO_NO_PERMITIDO = 405;
const ESTADO_ORIGEN_FALLIDO = 502;

const MENSAJE_POSTE_INVALIDO = "El poste debe ser un número de uno a cinco dígitos.";
const MENSAJE_LINEA_INVALIDA = "La línea debe tener de uno a cuatro caracteres alfanuméricos.";
const MENSAJE_POSTES_INVALIDOS = `Indica de 1 a ${MAXIMO_POSTES_LINEA} postes distintos en «postes», separados por comas y con uno a cinco dígitos cada uno.`;
const MENSAJE_NO_ENCONTRADO = "Ruta de la API no encontrada.";
const MENSAJE_METODO = "Método no permitido: usa GET.";
const MENSAJE_ORIGEN = "No se pudo obtener los tiempos del autobús. Inténtalo de nuevo en unos segundos.";
const MENSAJE_ORIGEN_GPS = "No se pudo obtener la posición de los autobuses. Inténtalo de nuevo en unos segundos.";

const PATRON_FILA_GPS = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
const PATRON_CELDA_GPS = /<td class="td_info2">([\s\S]*?)<\/td>/g;
const PATRON_NBSP = /&nbsp;?/gi;
const PATRON_ESPACIOS = /\s+/g;
const PATRON_MINUTOS = /^(\d+)\s*min\.?$/i;
const PATRON_KILOMETROS = /^(\d+)\s*kms?\.?$/i;
const PATRON_NUMERICO = /^\d+$/;
const SEPARADOR_LINEA_DESTINO = "->";
const MARCA_ICONO_POSTE = "bus_rojo";
const CELDAS_POR_FILA_GPS = 4;

function respuestaError(estado, mensaje, cabecerasExtra = {}) {
  return new Response(JSON.stringify({ error: mensaje }), {
    status: estado,
    headers: { ...CABECERAS_ERROR, ...cabecerasExtra },
  });
}

function decodificarCodigo(codigo, base) {
  const valor = Number.parseInt(codigo, base);
  return valor <= MAXIMO_PUNTO_DE_CODIGO ? String.fromCodePoint(valor) : "";
}

function decodificarEntidades(texto) {
  return texto.replace(PATRON_ENTIDAD, (entidad, hexadecimal, decimal, nombre) => {
    if (hexadecimal !== undefined) return decodificarCodigo(hexadecimal, BASE_HEXADECIMAL);
    if (decimal !== undefined) return decodificarCodigo(decimal, BASE_DECIMAL);
    return ENTIDADES_BASICAS[nombre.toLowerCase()] ?? entidad;
  });
}

function extraerFilasAvanza(html) {
  if (typeof html !== "string" || !html.includes(MARCA_CABECERA_POSTE)) {
    return null;
  }
  return [...html.matchAll(PATRON_FILA)].map(([, linea, destino, primero]) => ({
    linea: decodificarEntidades(linea).trim(),
    destino: decodificarEntidades(destino).trim(),
    primero: decodificarEntidades(primero).trim(),
  }));
}

function mapearDndzgz(datos) {
  if (datos === null || typeof datos !== "object" || !Array.isArray(datos.estimates)) {
    return null;
  }
  return datos.estimates
    .filter((e) => e !== null && typeof e === "object")
    .filter((e) => typeof e.line === "string" && typeof e.direction === "string")
    .filter((e) => Number.isFinite(e.estimate) && e.estimate >= 0)
    .map((e) => ({ linea: e.line, destino: e.direction, primero: e.estimate }));
}

async function pedirOrigen(url, leerCuerpo, opciones = OPCIONES_ORIGEN_TIEMPOS, tiempoMaximoMs = TIEMPO_MAXIMO_MS) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), tiempoMaximoMs);
  try {
    const respuesta = await fetch(url, {
      ...opciones,
      signal: controlador.signal,
      redirect: "manual",
    });
    if (!respuesta.ok) {
      throw new Error(`El origen respondió ${respuesta.status}.`);
    }
    return await leerCuerpo(respuesta);
  } finally {
    clearTimeout(temporizador);
  }
}

async function leerHtmlAvanza(respuesta) {
  return new TextDecoder(CODIFICACION_AVANZA).decode(await respuesta.arrayBuffer());
}

async function consultarAvanza(poste) {
  const filas = extraerFilasAvanza(await pedirOrigen(`${URL_AVANZA}${poste}`, leerHtmlAvanza));
  if (filas === null) {
    throw new Error("Formato inesperado: falta la cabecera «POSTE:».");
  }
  return filas;
}

async function consultarDndzgz(poste) {
  const filas = mapearDndzgz(await pedirOrigen(`${URL_DNDZGZ}${poste}`, (respuesta) => respuesta.json()));
  if (filas === null) {
    throw new Error("Formato inesperado: falta la lista «estimates».");
  }
  return filas;
}

function respuestaOk(origen, destinos) {
  return new Response(JSON.stringify({ origen, destinos }), { status: ESTADO_OK, headers: CABECERAS_OK });
}

async function responderPoste(poste) {
  let motivoAvanza;
  try {
    return respuestaOk(ORIGEN_AVANZA, await consultarAvanza(poste));
  } catch (error) {
    motivoAvanza = error.message;
  }
  try {
    return respuestaOk(ORIGEN_DNDZGZ, await consultarDndzgz(poste));
  } catch (error) {
    console.warn(`Orígenes del autobús no disponibles (poste ${poste}). Avanza: ${motivoAvanza} DNDzgz: ${error.message}`);
    return respuestaError(ESTADO_ORIGEN_FALLIDO, MENSAJE_ORIGEN);
  }
}

class FormatoGpsInesperado extends Error {}

function esObjeto(valor) {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

function leerCoordenadasGps(entrada) {
  const punto = entrada.coordenadas?.[0];
  if (!esObjeto(punto) || !Number.isFinite(punto.LAT) || !Number.isFinite(punto.LON)) {
    return null;
  }
  return { latitud: punto.LAT, longitud: punto.LON };
}

function esEntradaPoste(entrada) {
  return typeof entrada.icon === "string" && entrada.icon.includes(MARCA_ICONO_POSTE);
}

function normalizarLineaGps(linea) {
  return PATRON_NUMERICO.test(linea) ? String(Number(linea)) : linea.toUpperCase();
}

function limpiarCeldaGps(celda) {
  return decodificarEntidades(celda.replace(PATRON_NBSP, " ")).replace(PATRON_ESPACIOS, " ").trim();
}

function leerNumeroGps(texto, patron, campo) {
  const coincidencia = patron.exec(texto);
  if (coincidencia === null) {
    throw new FormatoGpsInesperado(`Valor de «${campo}» inesperado: «${texto}».`);
  }
  return Number(coincidencia[1]);
}

function leerFilaGps(celdas) {
  if (celdas.length !== CELDAS_POR_FILA_GPS) {
    throw new FormatoGpsInesperado(`Una fila tiene ${celdas.length} celdas y se esperaban ${CELDAS_POR_FILA_GPS}.`);
  }
  const [coche, lineaDestino, minutos, km] = celdas.map(limpiarCeldaGps);
  const separador = lineaDestino.indexOf(SEPARADOR_LINEA_DESTINO);
  const linea = separador < 0 ? "" : lineaDestino.slice(0, separador).trim();
  const destino = separador < 0 ? "" : lineaDestino.slice(separador + SEPARADOR_LINEA_DESTINO.length).trim();
  if (coche === "" || linea === "" || destino === "") {
    throw new FormatoGpsInesperado(`Fila sin coche, línea o destino: «${lineaDestino}».`);
  }
  return {
    coche,
    linea: normalizarLineaGps(linea),
    destino,
    llegada: { minutos: leerNumeroGps(minutos, PATRON_MINUTOS, "minutos"), km: leerNumeroGps(km, PATRON_KILOMETROS, "km") },
  };
}

function leerFilasGps(info) {
  if (typeof info !== "string") {
    throw new FormatoGpsInesperado("Un autobús no trae el campo «info».");
  }
  const filas = [...info.matchAll(PATRON_FILA_GPS)]
    .map(([, contenido]) => [...contenido.matchAll(PATRON_CELDA_GPS)].map(([, celda]) => celda))
    .filter((celdas) => celdas.length > 0)
    .map(leerFilaGps);
  if (filas.length === 0) {
    throw new FormatoGpsInesperado("Un autobús no trae ninguna fila de datos.");
  }
  return filas;
}

function agruparFilasGps(grupos, posicion, filas) {
  for (const { coche, linea, destino, llegada } of filas) {
    const clave = JSON.stringify([coche, linea, destino]);
    if (!grupos.has(clave)) {
      grupos.set(clave, { coche, linea, destino, latitud: posicion.latitud, longitud: posicion.longitud, llegadas: [] });
    }
    grupos.get(clave).llegadas.push(llegada);
  }
}

function mapearGps(datos) {
  if (!esObjeto(datos)) {
    throw new FormatoGpsInesperado("La respuesta no es un objeto.");
  }
  if (datos.maquinas === undefined) {
    return { poste: null, autobuses: [] };
  }
  if (!esObjeto(datos.maquinas)) {
    throw new FormatoGpsInesperado("«maquinas» no es un objeto.");
  }
  let poste = null;
  const grupos = new Map();
  for (const entrada of Object.values(datos.maquinas)) {
    if (!esObjeto(entrada)) {
      throw new FormatoGpsInesperado("Una entrada de «maquinas» no es un objeto.");
    }
    if (esEntradaPoste(entrada)) {
      poste = leerCoordenadasGps(entrada);
      continue;
    }
    const posicion = leerCoordenadasGps(entrada);
    if (posicion === null) {
      throw new FormatoGpsInesperado("Un autobús no tiene coordenadas numéricas.");
    }
    agruparFilasGps(grupos, posicion, leerFilasGps(entrada.info));
  }
  const autobuses = [...grupos.values()].map((grupo) => ({
    ...grupo,
    llegadas: grupo.llegadas.sort((a, b) => a.minutos - b.minutos),
  }));
  return { poste, autobuses };
}

async function consultarGps(poste, tiempoMaximoMs) {
  const datos = await pedirOrigen(URL_GPS_AVANZA, (respuesta) => respuesta.json(), {
    method: METODO_ORIGEN_GPS,
    headers: { "content-type": TIPO_FORMULARIO, "user-agent": USER_AGENT_GPS },
    body: `poste=${poste}&coche=0`,
  }, tiempoMaximoMs);
  return mapearGps(datos);
}

async function guardarEnCacheGps(clave, respuesta) {
  try {
    await caches.default.put(clave, respuesta.clone());
  } catch (error) {
    console.warn(`No se pudo guardar el GPS en caché: ${error.message}`);
  }
}

async function leerDeCacheGps(clave) {
  try {
    return await caches.default.match(clave);
  } catch (error) {
    console.warn(`No se pudo leer el GPS de la caché: ${error.message}`);
    return undefined;
  }
}

const ejecutarSinLimite = (tarea) => tarea();

function crearLimitadorConcurrencia(maximo) {
  let activas = 0;
  const esperando = [];
  const lanzarSiguiente = () => {
    if (activas >= maximo || esperando.length === 0) return;
    activas += 1;
    const { tarea, resolver, rechazar } = esperando.shift();
    tarea()
      .then(resolver, rechazar)
      .finally(() => {
        activas -= 1;
        lanzarSiguiente();
      });
  };
  return (tarea) =>
    new Promise((resolver, rechazar) => {
      esperando.push({ tarea, resolver, rechazar });
      lanzarSiguiente();
    });
}

async function responderGps(posteCrudo, { tiempoMaximoMs = TIEMPO_MAXIMO_GPS_MS, ejecutarConsulta = ejecutarSinLimite } = {}) {
  const poste = String(Number(posteCrudo));
  const hayCache = typeof caches !== "undefined";
  const clave = new Request(`${URL_CLAVE_CACHE_GPS}${poste}`);
  if (hayCache) {
    const guardada = await leerDeCacheGps(clave);
    if (guardada) return guardada;
  }
  let respuesta;
  try {
    respuesta = new Response(JSON.stringify(await ejecutarConsulta(() => consultarGps(poste, tiempoMaximoMs))), { status: ESTADO_OK, headers: CABECERAS_OK });
  } catch (error) {
    console.warn(`GPS de Avanza no disponible (poste ${poste}): ${error.message}`);
    return respuestaError(ESTADO_ORIGEN_FALLIDO, MENSAJE_ORIGEN_GPS);
  }
  if (hayCache) await guardarEnCacheGps(clave, respuesta);
  return respuesta;
}

function leerPostesLinea(parametros) {
  const lista = (parametros.get(PARAMETRO_POSTES) ?? "").split(SEPARADOR_POSTES);
  const validos = lista.length <= MAXIMO_POSTES_LINEA && lista.every((poste) => PATRON_POSTE.test(poste));
  const distintos = new Set(lista.map((poste) => String(Number(poste))));
  return validos && distintos.size === lista.length ? lista : null;
}

async function leerGpsDePoste(poste, ejecutarConsulta) {
  const respuesta = await responderGps(poste, { tiempoMaximoMs: TIEMPO_MAXIMO_GPS_LINEA_MS, ejecutarConsulta });
  return respuesta.status === ESTADO_OK ? respuesta.json() : null;
}

function unirAutobusesDeLinea(lineaNormalizada, resultados) {
  const porCoche = new Map();
  for (const datos of resultados.filter((resultado) => resultado !== null)) {
    for (const { coche, linea, destino, latitud, longitud } of datos.autobuses) {
      if (linea === lineaNormalizada && !porCoche.has(coche)) {
        porCoche.set(coche, { coche, linea, destino, latitud, longitud });
      }
    }
  }
  return [...porCoche.values()];
}

async function responderGpsLinea(linea, parametros) {
  if (!PATRON_LINEA.test(linea)) {
    return respuestaError(ESTADO_PETICION_INVALIDA, MENSAJE_LINEA_INVALIDA);
  }
  const postes = leerPostesLinea(parametros);
  if (postes === null) {
    return respuestaError(ESTADO_PETICION_INVALIDA, MENSAJE_POSTES_INVALIDOS);
  }
  const ejecutarConsulta = crearLimitadorConcurrencia(MAXIMO_CONSULTAS_SIMULTANEAS_GPS_LINEA);
  const resultados = await Promise.all(postes.map((poste) => leerGpsDePoste(poste, ejecutarConsulta)));
  const postesFallidos = resultados.filter((resultado) => resultado === null).length;
  if (postesFallidos === postes.length) {
    return respuestaError(ESTADO_ORIGEN_FALLIDO, MENSAJE_ORIGEN_GPS);
  }
  const lineaNormalizada = normalizarLineaGps(linea);
  const cuerpo = {
    linea: lineaNormalizada,
    autobuses: unirAutobusesDeLinea(lineaNormalizada, resultados),
    postesConsultados: postes.length - postesFallidos,
    postesFallidos,
  };
  return new Response(JSON.stringify(cuerpo), { status: ESTADO_OK, headers: CABECERAS_OK });
}

const RUTAS_API = [
  { prefijo: PREFIJO_RUTA_POSTE, responder: responderPoste },
  { prefijo: PREFIJO_RUTA_GPS, responder: (poste) => responderGps(poste) },
];

function responderApi({ pathname: ruta, searchParams }) {
  if (ruta.startsWith(PREFIJO_RUTA_GPS_LINEA)) {
    return responderGpsLinea(ruta.slice(PREFIJO_RUTA_GPS_LINEA.length), searchParams);
  }
  const destino = RUTAS_API.find(({ prefijo }) => ruta.startsWith(prefijo));
  if (destino === undefined) {
    return respuestaError(ESTADO_NO_ENCONTRADO, MENSAJE_NO_ENCONTRADO);
  }
  const poste = ruta.slice(destino.prefijo.length);
  if (!PATRON_POSTE.test(poste)) {
    return respuestaError(ESTADO_PETICION_INVALIDA, MENSAJE_POSTE_INVALIDO);
  }
  return destino.responder(poste);
}

export default {
  async fetch(request) {
    if (request.method === METODO_PREFLIGHT) {
      return new Response(null, { status: ESTADO_SIN_CONTENIDO, headers: CABECERAS_CORS });
    }
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIJO_API)) {
      return respuestaError(ESTADO_NO_ENCONTRADO, MENSAJE_NO_ENCONTRADO);
    }
    if (request.method !== METODO_PERMITIDO) {
      return respuestaError(ESTADO_METODO_NO_PERMITIDO, MENSAJE_METODO, { allow: METODO_PERMITIDO });
    }
    return responderApi(url);
  },
};
