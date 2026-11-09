/**
 * Brand configuration. Every brand-specific value lives here so the product
 * can be renamed or re-skinned without touching application logic.
 *
 * The frontend reads overrides from VITE_BRAND_* env vars and the backend from
 * BRAND_* env vars (see each app's config module). These are the defaults.
 */
export interface BrandConfig {
  name: string;
  tagline: string;
  supportEmail: string;
  /** Hex colours. The frontend derives shades from these with CSS color-mix. */
  colors: {
    primary: string;
    accent: string;
  };
  logoUrl?: string;
}

export const defaultBrand: BrandConfig = {
  name: 'FitGeng',
  tagline: 'Find your game. Find your people.',
  supportEmail: 'support@fitgeng.com',
  colors: {
    primary: '#16a34a',
    accent: '#f97316',
  },
};

export interface BrandOverrides {
  name?: string;
  tagline?: string;
  supportEmail?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}

export function resolveBrand(overrides: BrandOverrides = {}): BrandConfig {
  return {
    name: overrides.name || defaultBrand.name,
    tagline: overrides.tagline || defaultBrand.tagline,
    supportEmail: overrides.supportEmail || defaultBrand.supportEmail,
    colors: {
      primary: overrides.primaryColor || defaultBrand.colors.primary,
      accent: overrides.accentColor || defaultBrand.colors.accent,
    },
    logoUrl: overrides.logoUrl || defaultBrand.logoUrl,
  };
}
