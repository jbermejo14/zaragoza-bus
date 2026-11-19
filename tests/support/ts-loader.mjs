// Cargador de módulos para ejecutar las pruebas con `node --test` sin tsx.
//
// Por qué existe: en este equipo una directiva de Control de aplicaciones de Windows bloquea
// esbuild.exe, del que depende tsx. Este cargador transpila .ts y .tsx con el compilador de
// TypeScript (ya instalado como dependencia de desarrollo), resuelve el alias `@/` a la raíz del
// proyecto y las importaciones relativas sin extensión, y convierte los .json en módulos ES.
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const PROJECT_ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROJECT_ALIAS = '@/';
const CANDIDATE_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
const TYPESCRIPT_FILE = /\.tsx?$/;
const JSON_FILE = /\.json$/;

const COMPILER_OPTIONS = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  verbatimModuleSyntax: false,
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    // No existe: se prueba el siguiente candidato.
    return false;
  }
}

async function findProjectFile(basePath) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${basePath}${suffix}`;
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

function projectBasePath(specifier, parentURL) {
  if (specifier.startsWith(PROJECT_ALIAS)) {
    return resolvePath(PROJECT_ROOT, specifier.slice(PROJECT_ALIAS.length));
  }
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  if (isRelative && parentURL?.startsWith('file:')) {
    return resolvePath(dirname(fileURLToPath(parentURL)), specifier);
  }
  return null;
}

/**
 * Paquetes CommonJS sin campo `exports` (como `next/script`) solo se resuelven en ESM con la
 * extensión explícita: si la ruta sin extensión no existe, se reintenta con `.js`.
 */
async function resolvePackage(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isSubpath = specifier.includes('/') && !specifier.endsWith('.js');
    if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !isSubpath) throw error;
    return nextResolve(`${specifier}.js`, context);
  }
}

export async function resolve(specifier, context, nextResolve) {
  const basePath = projectBasePath(specifier, context.parentURL);
  if (basePath === null) return resolvePackage(specifier, context, nextResolve);
  const file = await findProjectFile(basePath);
  if (file === null) {
    throw new Error(`No se encuentra el módulo "${specifier}" importado desde ${context.parentURL}.`);
  }
  return { url: pathToFileURL(file).href, shortCircuit: true };
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith('file:')) return nextLoad(url, context);
  const path = fileURLToPath(url);
  if (TYPESCRIPT_FILE.test(path)) {
    const source = await readFile(path, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: COMPILER_OPTIONS, fileName: path });
    return { format: 'module', source: output.outputText, shortCircuit: true };
  }
  if (JSON_FILE.test(path)) {
    const source = await readFile(path, 'utf8');
    return { format: 'module', source: `export default ${source};`, shortCircuit: true };
  }
  return nextLoad(url, context);
}
