/**
 * Brand identity (name, copy, contact, logo). Every brand-specific value lives
 * here so the product can be renamed without touching application logic.
 * Colours live in theme.ts.
 *
 * The frontend reads overrides from NEXT_PUBLIC_BRAND_* env vars and the backend
 * from BRAND_* env vars (see each app's config module). These are the defaults.
 */
export interface BrandConfig {
  name: string;
  tagline: string;
  description: string;
  supportEmail: string;
  logoUrl?: string;
}

export const defaultBrand: BrandConfig = {
  name: 'FitGeng',
  tagline: 'Find your game. Find your people.',
  description:
    'Discover sports groups, coaches and events across Lagos and Nigeria. Join training groups, track sessions and manage memberships in one place.',
  supportEmail: 'support@fitgeng.com',
};

export interface BrandOverrides {
  name?: string;
  tagline?: string;
  description?: string;
  supportEmail?: string;
  logoUrl?: string;
}

export function resolveBrand(overrides: BrandOverrides = {}): BrandConfig {
  return {
    name: overrides.name || defaultBrand.name,
    tagline: overrides.tagline || defaultBrand.tagline,
    description: overrides.description || defaultBrand.description,
    supportEmail: overrides.supportEmail || defaultBrand.supportEmail,
    logoUrl: overrides.logoUrl || defaultBrand.logoUrl,
  };
}
