import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clusterByGrid } from '../lib/stop-clustering';

interface TestItem {
  id: string;
  x: number;
  y: number;
}

const CELL = 56;
const MIN = 5;
const toScreen = (item: TestItem) => ({ x: item.x, y: item.y });

function itemsAt(x: number, y: number, count: number, prefix: string): TestItem[] {
  return Array.from({ length: count }, (_, index) => ({ id: `${prefix}${index}`, x: x + index, y }));
}

const ids = (items: TestItem[]) => items.map((item) => item.id);

test('4 elementos en una celda quedan sueltos', () => {
  const result = clusterByGrid(itemsAt(10, 10, 4, 'a'), toScreen, CELL, MIN);
  assert.equal(result.clusters.length, 0);
  assert.deepEqual(ids(result.singles), ['a0', 'a1', 'a2', 'a3']);
});

test('5 elementos en una celda forman un grupo', () => {
  const result = clusterByGrid(itemsAt(10, 10, 5, 'a'), toScreen, CELL, MIN);
  assert.equal(result.clusters.length, 1);
  assert.deepEqual(ids(result.clusters[0].items), ['a0', 'a1', 'a2', 'a3', 'a4']);
  assert.deepEqual(result.singles, []);
});

test('lista vacía: sin grupos ni sueltos', () => {
  assert.deepEqual(clusterByGrid([], toScreen, CELL, MIN), { clusters: [], singles: [] });
});

test('varias celdas: una agrupada y otra suelta, y el orden de entrada se conserva', () => {
  const crowded = itemsAt(10, 10, 6, 'c');
  const lonely = itemsAt(200, 200, 2, 's');
  const input = [crowded[0], lonely[0], ...crowded.slice(1), lonely[1]];
  const result = clusterByGrid(input, toScreen, CELL, MIN);
  assert.equal(result.clusters.length, 1);
  assert.deepEqual(ids(result.clusters[0].items), ['c0', 'c1', 'c2', 'c3', 'c4', 'c5']);
  assert.deepEqual(ids(result.singles), ['s0', 's1']);
});

test('elementos a ambos lados del borde de celda no se juntan', () => {
  const left = itemsAt(50, 10, 3, 'l').map((item) => ({ ...item, x: 50 }));
  const right = itemsAt(60, 10, 3, 'r').map((item) => ({ ...item, x: 60 }));
  const result = clusterByGrid([...left, ...right], toScreen, CELL, MIN);
  assert.equal(result.clusters.length, 0);
  assert.equal(result.singles.length, 6);
});

test('dos grupos en celdas distintas', () => {
  const result = clusterByGrid([...itemsAt(10, 10, 5, 'a'), ...itemsAt(300, 300, 7, 'b')], toScreen, CELL, MIN);
  assert.equal(result.clusters.length, 2);
  assert.deepEqual(result.clusters.map((cluster) => cluster.items.length), [5, 7]);
});
