import fs from 'node:fs';
import path from 'node:path';
import { defaultTheme, resolveTheme, themeToCss } from '@fitgeng/shared';

describe('theme (single colour source)', () => {
  it('serialises palette and light/dark surface tokens to CSS variables', () => {
    const css = themeToCss(defaultTheme);
    expect(css).toContain(`--fg-brand:${defaultTheme.palette.brand}`);
    expect(css).toContain(`--fg-surface:${defaultTheme.light.surface}`);
    expect(css).toMatch(/\.dark\{[^}]*--fg-surface:#0f172a/);
  });

  it('applies valid env overrides and ignores invalid ones', () => {
    expect(resolveTheme({ brandColor: '#123abc' }).palette.brand).toBe('#123abc');
    expect(resolveTheme({ brandColor: 'red; } body { display:none' }).palette.brand).toBe(defaultTheme.palette.brand);
  });
});

/**
 * Guard for the one-file colour rule: components must use semantic tokens
 * (bg-surface, text-fg-muted, brand-600, …), never raw hex values or Tailwind's
 * built-in palette classes. Colours change only in packages/shared/src/theme.ts.
 */
describe('design-token guard', () => {
  const srcDir = path.resolve(__dirname, '../..');
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && entry.name !== 'test') walk(full);
      } else if (/\.(tsx?|css)$/.test(entry.name)) {
        files.push(full);
      }
    }
  };
  walk(srcDir);

  const palette =
    /\b(?:bg|text|border|ring|from|to|via|fill|stroke|outline|shadow|divide|placeholder|decoration|accent-color)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b/;
  const hex = /#[0-9a-fA-F]{3,8}\b/;

  it.each(files.map((f) => [path.relative(srcDir, f), f]))('%s uses only theme tokens', (_rel, file) => {
    const offending = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => palette.test(line) || hex.test(line));
    expect(offending).toEqual([]);
  });
});
