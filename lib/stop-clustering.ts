/** Posición de un elemento en pantalla (píxeles) al zoom actual. */
export interface ScreenPoint {
  x: number;
  y: number;
}

/** Grupo de elementos de una misma celda; siempre tiene al menos `minSize` elementos. */
export interface StopCluster<T> {
  items: T[];
}

export interface ClusteringResult<T> {
  clusters: StopCluster<T>[];
  singles: T[];
}

/**
 * Agrupa por rejilla: reparte los elementos en celdas de `cellSizePx` según su posición en pantalla.
 * Una celda con `minSize` o más elementos es un grupo; con menos, sus elementos quedan sueltos.
 * Conserva el orden de entrada tanto en los grupos como en los sueltos.
 */
export function clusterByGrid<T>(
  items: readonly T[],
  toScreen: (item: T) => ScreenPoint,
  cellSizePx: number,
  minSize: number,
): ClusteringResult<T> {
  // Las celdas guardan índices (no elementos) para no depender de la identidad de T.
  const cells = new Map<string, number[]>();
  items.forEach((item, index) => {
    const point = toScreen(item);
    const key = `${Math.floor(point.x / cellSizePx)}:${Math.floor(point.y / cellSizePx)}`;
    const cell = cells.get(key);
    if (cell === undefined) {
      cells.set(key, [index]);
    } else {
      cell.push(index);
    }
  });
  const isGrouped = new Array<boolean>(items.length).fill(false);
  const clusters: StopCluster<T>[] = [];
  for (const indexes of cells.values()) {
    if (indexes.length >= minSize) {
      indexes.forEach((index) => {
        isGrouped[index] = true;
      });
      clusters.push({ items: indexes.map((index) => items[index]) });
    }
  }
  return { clusters, singles: items.filter((_, index) => !isGrouped[index]) };
}
