import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Contraste mínimo AA para texto normal (WCAG 2.1).
const MIN_TEXT_CONTRAST = 4.5;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const WHITE = '#ffffff';

const globalsCss = readFileSync(path.join(process.cwd(), 'app', 'globals.css'), 'utf-8').replace(/\r\n/g, '\n');
const LIGHT_THEME_BLOCK = /@theme static\s*\{([^}]*)\}/;
const DARK_THEME_BLOCK = /\[data-theme="dark"\]\s*\{([^}]*)\}/;

const TEXT_TOKENS = ['--color-ink', '--color-muted', '--color-accent-text'];
const SURFACE_TOKENS = ['--color-surface', '--color-card'];
const FILL_TOKENS = ['--color-accent', '--color-accent-hover'];

function contrastReadTokens(blockPattern: RegExp): Record<string, string> {
  const match = blockPattern.exec(globalsCss);
  assert.ok(match, `No se encuentra el bloque ${blockPattern} en globals.css`);
  const tokens: Record<string, string> = {};
  for (const token of match[1].matchAll(/(--[a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[token[1]] = token[2];
  }
  return tokens;
}

function contrastChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function contrastLuminance(hex: string): number {
  assert.match(hex, HEX_COLOR);
  const [red, green, blue] = [1, 3, 5].map(start => contrastChannelToLinear(parseInt(hex.slice(start, start + 2), 16)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [contrastLuminance(foreground), contrastLuminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const THEMES: Record<string, Record<string, string>> = {
  claro: contrastReadTokens(LIGHT_THEME_BLOCK),
  oscuro: contrastReadTokens(DARK_THEME_BLOCK),
};

for (const [themeName, tokens] of Object.entries(THEMES)) {
  test(`contraste: texto (ink, muted, accent-text) sobre surface y card en tema ${themeName}`, () => {
    for (const text of TEXT_TOKENS) {
      for (const surface of SURFACE_TOKENS) {
        const ratio = contrastRatio(tokens[text], tokens[surface]);
        assert.ok(ratio >= MIN_TEXT_CONTRAST, `${text} sobre ${surface} en tema ${themeName}: ${ratio.toFixed(2)}`);
      }
    }
  });

  test(`contraste: texto blanco sobre los rellenos de acento en tema ${themeName}`, () => {
    for (const fill of FILL_TOKENS) {
      const ratio = contrastRatio(WHITE, tokens[fill]);
      assert.ok(ratio >= MIN_TEXT_CONTRAST, `blanco sobre ${fill} en tema ${themeName}: ${ratio.toFixed(2)}`);
    }
  });
}
