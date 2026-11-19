const COMBINING_MARKS = /[̀-ͯ]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

/**
 * Normaliza texto para comparar búsquedas: minúsculas, sin tildes ni diéresis,
 * cualquier carácter que no sea letra ASCII o dígito pasa a espacio y los
 * espacios se colapsan y recortan.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, ' ')
    .trim();
}
