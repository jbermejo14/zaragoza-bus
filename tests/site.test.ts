import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { absoluteUrl, assetPath, BASE_PATH, getSiteUrl } from '../lib/site';
import nextConfig from '../next.config';

const SITE_ORIGIN = 'https://ododex.com';
const SOURCE_DIRS = ['app', 'components'];

function siteConOrigen(origen: string | undefined, prueba: () => void): void {
  const previo = process.env.NEXT_PUBLIC_SITE_URL;
  if (origen === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = origen;
  try {
    prueba();
  } finally {
    if (previo === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previo;
  }
}

function siteTsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return siteTsxFiles(full);
    return full.endsWith('.tsx') ? [full] : [];
  });
}

test('BASE_PATH es /es/zaragoza-bus', () => {
  assert.equal(BASE_PATH, '/es/zaragoza-bus');
});

test('absoluteUrl: raíz vacía o con barra devuelve origen + ruta base sin barra final', () => {
  siteConOrigen(SITE_ORIGIN, () => {
    assert.equal(absoluteUrl('/'), `${SITE_ORIGIN}/es/zaragoza-bus`);
    assert.equal(absoluteUrl(''), `${SITE_ORIGIN}/es/zaragoza-bus`);
  });
});

test('absoluteUrl: ruta con y sin barra inicial', () => {
  siteConOrigen(SITE_ORIGIN, () => {
    assert.equal(absoluteUrl('/aviso-legal'), `${SITE_ORIGIN}/es/zaragoza-bus/aviso-legal`);
    assert.equal(absoluteUrl('aviso-legal'), `${SITE_ORIGIN}/es/zaragoza-bus/aviso-legal`);
  });
});

test('getSiteUrl: quita barras finales y usa localhost por defecto', () => {
  siteConOrigen(`${SITE_ORIGIN}/`, () => {
    assert.equal(getSiteUrl(), SITE_ORIGIN);
    assert.equal(absoluteUrl('/cookies'), `${SITE_ORIGIN}/es/zaragoza-bus/cookies`);
  });
  siteConOrigen(undefined, () => {
    assert.equal(getSiteUrl(), 'http://localhost:3000');
  });
});

test('assetPath antepone la ruta base', () => {
  assert.equal(assetPath('/brand/x.svg'), '/es/zaragoza-bus/brand/x.svg');
  assert.equal(assetPath('brand/x.svg'), '/es/zaragoza-bus/brand/x.svg');
});

test('ningún .tsx de app/ ni components/ usa src="/ literal', () => {
  for (const dir of SOURCE_DIRS) {
    for (const file of siteTsxFiles(dir)) {
      assert.ok(!readFileSync(file, 'utf8').includes('src="/'), `${file} contiene src="/ sin assetPath`);
    }
  }
});

test('next.config.ts usa la misma ruta base que lib/site.ts', () => {
  assert.equal(nextConfig.basePath, BASE_PATH);
});

test('next.config.ts exporta el sitio como ficheros estáticos', () => {
  assert.equal(nextConfig.output, 'export');
});
