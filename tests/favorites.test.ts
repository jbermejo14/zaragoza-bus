import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFavorites, saveFavorites, toggleFavorite } from '../lib/favorites';
import { FAVORITES_STORAGE_KEY } from '../lib/config';

function makeMemoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}

function makeThrowingStorage(): Storage {
  const fail = (): never => {
    throw new Error('almacenamiento bloqueado');
  };
  return { getItem: fail, setItem: fail, removeItem: fail, clear: fail, key: fail, length: 0 };
}

test('loadFavorites devuelve [] con null, ausente o acceso que lanza', () => {
  assert.deepEqual(loadFavorites(null), []);
  assert.deepEqual(loadFavorites(makeMemoryStorage()), []);
  assert.deepEqual(loadFavorites(makeThrowingStorage()), []);
});

test('loadFavorites devuelve [] con JSON roto o que no es array', () => {
  assert.deepEqual(loadFavorites(makeMemoryStorage({ [FAVORITES_STORAGE_KEY]: '{roto' })), []);
  assert.deepEqual(loadFavorites(makeMemoryStorage({ [FAVORITES_STORAGE_KEY]: '{"a":1}' })), []);
  assert.deepEqual(loadFavorites(makeMemoryStorage({ [FAVORITES_STORAGE_KEY]: '"texto"' })), []);
});

test('loadFavorites filtra no-cadenas y duplicados', () => {
  const storage = makeMemoryStorage({
    [FAVORITES_STORAGE_KEY]: JSON.stringify(['tuzsa-1', 5, null, 'tuzsa-2', 'tuzsa-1']),
  });
  assert.deepEqual(loadFavorites(storage), ['tuzsa-1', 'tuzsa-2']);
});

test('saveFavorites y loadFavorites hacen ida y vuelta', () => {
  const storage = makeMemoryStorage();
  saveFavorites(storage, ['tuzsa-3', 'tuzsa-1']);
  assert.equal(storage.getItem(FAVORITES_STORAGE_KEY), '["tuzsa-3","tuzsa-1"]');
  assert.deepEqual(loadFavorites(storage), ['tuzsa-3', 'tuzsa-1']);
});

test('saveFavorites con null no hace nada', () => {
  assert.doesNotThrow(() => saveFavorites(null, ['tuzsa-1']));
});

test('saveFavorites no propaga errores y avisa con console.warn', (context) => {
  const warn = context.mock.method(console, 'warn', () => undefined);
  assert.doesNotThrow(() => saveFavorites(makeThrowingStorage(), ['tuzsa-1']));
  assert.equal(warn.mock.callCount(), 1);
  assert.match(String(warn.mock.calls[0].arguments[0]), /almacenamiento bloqueado/);
});

test('toggleFavorite añade al final o quita sin mutar la entrada', () => {
  const original = ['tuzsa-1', 'tuzsa-2'];
  const added = toggleFavorite(original, 'tuzsa-3');
  assert.deepEqual(added, ['tuzsa-1', 'tuzsa-2', 'tuzsa-3']);
  const removed = toggleFavorite(original, 'tuzsa-1');
  assert.deepEqual(removed, ['tuzsa-2']);
  assert.deepEqual(original, ['tuzsa-1', 'tuzsa-2']);
  assert.notEqual(added, original);
});
