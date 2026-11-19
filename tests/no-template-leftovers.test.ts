import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const LEFTOVERS_OUTPUT_DIRECTORY = 'out';
const LEFTOVERS_SKIP_MESSAGE = 'No existe out/: ejecuta npm run build y repite las pruebas.';
const LEFTOVERS_SCRIPTS = /<script[\s\S]*?<\/script>/g;
const LEFTOVERS_STYLES = /<style[\s\S]*?<\/style>/g;
const LEFTOVERS_TAGS = /<[^>]*>/g;
const LEFTOVERS_PLACEHOLDER = /\{[a-zA-Z][^}]*\}/;
const LEFTOVERS_WORDS = [/\bundefined\b/, /\bNaN\b/, /\bnull\b/];
/** Palabras gramaticales que nunca van repetidas seguidas en castellano ("entre entre", "de de"). */
const LEFTOVERS_REPEATED = /\b(entre|de|del|en|la|el|los|las|y|con|por|que|para|un|una|unos) \1\b/i;
const LEFTOVERS_REPORT_LIMIT = 10;

function leftoversHtmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return leftoversHtmlFiles(fullPath);
    return entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

/** Texto que ve el visitante: sin scripts (datos de Next y JSON-LD) ni etiquetas. */
function leftoversVisibleText(html: string): string {
  return html.replace(LEFTOVERS_SCRIPTS, ' ').replace(LEFTOVERS_STYLES, ' ').replace(LEFTOVERS_TAGS, ' ');
}

function leftoversProblems(text: string): string[] {
  const problems = LEFTOVERS_WORDS.filter(word => word.test(text)).map(word => String(word));
  const found = [...problems];
  if (LEFTOVERS_PLACEHOLDER.test(text)) found.push(String(LEFTOVERS_PLACEHOLDER));
  const repeated = text.replace(/\s+/g, ' ').match(LEFTOVERS_REPEATED);
  if (repeated) found.push(`palabra repetida: "${repeated[0]}"`);
  return found;
}

test('compilación: ningún HTML de out/ tiene plantillas sin rellenar, undefined, NaN ni null visibles', t => {
  const directory = path.join(process.cwd(), LEFTOVERS_OUTPUT_DIRECTORY);
  if (!existsSync(directory)) {
    t.skip(LEFTOVERS_SKIP_MESSAGE);
    return;
  }
  const offenders = leftoversHtmlFiles(directory)
    .map(file => ({ file: path.relative(directory, file), problems: leftoversProblems(leftoversVisibleText(readFileSync(file, 'utf-8'))) }))
    .filter(item => item.problems.length > 0);
  assert.deepEqual(offenders.slice(0, LEFTOVERS_REPORT_LIMIT), []);
});
