import assert from 'node:assert/strict';
import { test } from 'node:test';
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, oppositeTheme, readTheme, toggleTheme } from '../lib/theme';

function makeRoot(theme: string | null) {
  const attributes = new Map<string, string>();
  if (theme !== null) {
    attributes.set('data-theme', theme);
  }
  return {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
  };
}

function makeStorage(failOnSet: boolean) {
  const values = new Map<string, string>();
  const storage = {
    setItem: (key: string, value: string) => {
      if (failOnSet) {
        throw new Error('cuota superada');
      }
      values.set(key, value);
    },
  };
  return { storage: storage as unknown as Storage, values };
}

test('readTheme: sin atributo o con un valor desconocido es claro', () => {
  assert.equal(readTheme(makeRoot(null)), 'light');
  assert.equal(readTheme(makeRoot('sepia')), 'light');
  assert.equal(readTheme(makeRoot('dark')), 'dark');
});

test('oppositeTheme alterna entre claro y oscuro', () => {
  assert.equal(oppositeTheme('light'), 'dark');
  assert.equal(oppositeTheme('dark'), 'light');
});

test('toggleTheme cambia el atributo y guarda la elección', () => {
  const root = makeRoot('light');
  const { storage, values } = makeStorage(false);
  assert.equal(toggleTheme(root, storage), 'dark');
  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(values.get(THEME_STORAGE_KEY), 'dark');
  assert.equal(toggleTheme(root, storage), 'light');
  assert.equal(values.get(THEME_STORAGE_KEY), 'light');
});

test('toggleTheme sin almacenamiento o con almacenamiento que falla cambia el tema igualmente', () => {
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    const withoutStorage = makeRoot('dark');
    assert.equal(toggleTheme(withoutStorage, null), 'light');
    const failing = makeRoot('light');
    assert.equal(toggleTheme(failing, makeStorage(true).storage), 'dark');
    assert.equal(failing.getAttribute('data-theme'), 'dark');
  } finally {
    console.warn = originalWarn;
  }
});

function runInitScript(saved: string | null, prefersDark: boolean, storageThrows = false): string | null {
  const attributes = new Map<string, string>();
  const fakeWindow = { matchMedia: () => ({ matches: prefersDark }) };
  const fakeDocument = { documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) } };
  const fakeStorage = {
    getItem: () => {
      if (storageThrows) {
        throw new Error('bloqueado');
      }
      return saved;
    },
  };
  new Function('window', 'document', 'localStorage', THEME_INIT_SCRIPT)(fakeWindow, fakeDocument, fakeStorage);
  return attributes.get('data-theme') ?? null;
}

test('el script previo al pintado usa la clave compartida de Ododex', () => {
  assert.equal(THEME_STORAGE_KEY, 'ododex-theme');
  assert.ok(THEME_INIT_SCRIPT.includes(`'${THEME_STORAGE_KEY}'`));
});

test('el script elige: guardado, luego sistema, luego claro (y claro si el almacenamiento falla)', () => {
  assert.equal(runInitScript('dark', false), 'dark');
  assert.equal(runInitScript('light', true), 'light');
  assert.equal(runInitScript(null, true), 'dark');
  assert.equal(runInitScript(null, false), 'light');
  assert.equal(runInitScript('invalido', true), 'dark');
  assert.equal(runInitScript(null, true, true), 'light');
});
