import { resolveBrand, resolveTheme, themeToCss } from '@fitgeng/shared';
import { env } from '@/config/env';

/** Active brand identity: shared defaults overridden by NEXT_PUBLIC_BRAND_* env vars. */
export const brand = resolveBrand(env.brand);

/** Active colour theme: packages/shared/src/theme.ts plus env overrides. */
export const theme = resolveTheme(env.theme);

/** CSS variables for the theme. The root layout renders this in <head>. */
export const themeCss = themeToCss(theme);
