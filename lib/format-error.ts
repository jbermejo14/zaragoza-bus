/**
 * Clase base de los errores de formato de las respuestas de la API.
 * Permite a `describeFailure` clasificarlos sin importar cada parser (evita dependencias circulares).
 */
export class FormatError extends Error {}
