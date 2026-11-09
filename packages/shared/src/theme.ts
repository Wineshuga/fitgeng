/**
 * THE colour file. Every colour in the product comes from here: the web UI
 * (as CSS variables, see themeToCss), the favicon, the browser theme-colour
 * and, later, transactional emails. Change a value here and it changes everywhere.
 *
 * Components never use raw hex values or Tailwind palette classes (slate-*,
 * red-*, …). They use the semantic classes these tokens generate:
 *   bg-canvas, bg-surface, bg-surface-muted, border-line, text-fg, text-fg-muted,
 *   text-fg-subtle, brand-50…950, accent-50…600, success/warning/danger/info (+ -soft).
 * A test in the frontend fails if a component goes around this file.
 */

export type Hex = `#${string}`;

export interface ThemePalette {
  /** Main brand colour. Tailwind brand-50…950 are derived from it. */
  brand: Hex;
  /** Secondary highlight colour. Tailwind accent-50…600 are derived from it. */
  accent: Hex;
  success: Hex;
  warning: Hex;
  danger: Hex;
  info: Hex;
  /** Neutral scale used for surfaces, borders and text. */
  neutral: Record<0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, Hex>;
}

/** Semantic roles. Each mode maps them onto the neutral scale. */
export interface SurfaceTokens {
  canvas: Hex;
  surface: Hex;
  surfaceMuted: Hex;
  line: Hex;
  lineStrong: Hex;
  fg: Hex;
  fgMuted: Hex;
  fgSubtle: Hex;
}

export interface Theme {
  palette: ThemePalette;
  light: SurfaceTokens;
  dark: SurfaceTokens;
}

const neutral: ThemePalette['neutral'] = {
  0: '#ffffff',
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

export const defaultTheme: Theme = {
  palette: {
    brand: '#16a34a',
    accent: '#f97316',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#dc2626',
    info: '#2563eb',
    neutral,
  },
  light: {
    canvas: neutral[50],
    surface: neutral[0],
    surfaceMuted: neutral[100],
    line: neutral[200],
    lineStrong: neutral[300],
    fg: neutral[900],
    fgMuted: neutral[600],
    fgSubtle: neutral[500],
  },
  dark: {
    canvas: neutral[950],
    surface: neutral[900],
    surfaceMuted: neutral[800],
    line: neutral[800],
    lineStrong: neutral[700],
    fg: neutral[100],
    fgMuted: neutral[300],
    fgSubtle: neutral[400],
  },
};

export interface ThemeOverrides {
  brandColor?: string;
  accentColor?: string;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Applies deployment overrides (env vars). Invalid values are ignored rather than breaking styles. */
export function resolveTheme(overrides: ThemeOverrides = {}): Theme {
  const pick = (value: string | undefined, fallback: Hex): Hex =>
    value && HEX.test(value) ? (value as Hex) : fallback;
  return {
    ...defaultTheme,
    palette: {
      ...defaultTheme.palette,
      brand: pick(overrides.brandColor, defaultTheme.palette.brand),
      accent: pick(overrides.accentColor, defaultTheme.palette.accent),
    },
  };
}

function surfaceVars(t: SurfaceTokens): string {
  return [
    `--fg-canvas:${t.canvas}`,
    `--fg-surface:${t.surface}`,
    `--fg-surface-muted:${t.surfaceMuted}`,
    `--fg-line:${t.line}`,
    `--fg-line-strong:${t.lineStrong}`,
    `--fg-text:${t.fg}`,
    `--fg-text-muted:${t.fgMuted}`,
    `--fg-text-subtle:${t.fgSubtle}`,
  ].join(';');
}

/**
 * Serialises the theme to CSS custom properties. The frontend's globals.css maps
 * these onto Tailwind colour classes. `.dark` swaps only the surface tokens; brand
 * and status colours stay the same in both modes.
 */
export function themeToCss(theme: Theme): string {
  const p = theme.palette;
  const neutrals = Object.entries(p.neutral)
    .map(([k, v]) => `--fg-neutral-${k}:${v}`)
    .join(';');
  const base = [
    `--fg-brand:${p.brand}`,
    `--fg-accent:${p.accent}`,
    `--fg-success:${p.success}`,
    `--fg-warning:${p.warning}`,
    `--fg-danger:${p.danger}`,
    `--fg-info:${p.info}`,
    neutrals,
  ].join(';');
  return `:root{${base};${surfaceVars(theme.light)};color-scheme:light}.dark{${surfaceVars(theme.dark)};color-scheme:dark}`;
}
