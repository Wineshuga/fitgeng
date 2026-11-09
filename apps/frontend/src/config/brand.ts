import { resolveBrand } from '@fitgeng/shared';
import { env } from '@/config/env';

/** Active brand: shared defaults overridden by VITE_BRAND_* env vars. */
export const brand = resolveBrand(env.brand);

/**
 * Writes the brand colours to CSS variables. Tailwind's `brand` and `accent`
 * colour scales are defined on top of these in index.css, so components never
 * hardcode brand hex values.
 */
export function applyBrandTheme(root: HTMLElement = document.documentElement): void {
  root.style.setProperty('--brand-primary', brand.colors.primary);
  root.style.setProperty('--brand-accent', brand.colors.accent);
  document.title = brand.name;
}
