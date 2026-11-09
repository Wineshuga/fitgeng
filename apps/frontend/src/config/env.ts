/**
 * Public (browser-safe) configuration. NEXT_PUBLIC_* values are inlined at
 * build time, so each one must be referenced literally and must never hold a
 * secret. Server-only settings (e.g. INTERNAL_API_URL) are read in server-only
 * modules under src/lib, never here.
 */
export const env = {
  /** Browser-facing API base. Relative, so it stays on the site's own origin. */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  /** Canonical public origin, used for absolute URLs in metadata and the sitemap. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  brand: {
    name: process.env.NEXT_PUBLIC_BRAND_NAME,
    tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE,
    description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION,
    supportEmail: process.env.NEXT_PUBLIC_BRAND_SUPPORT_EMAIL,
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL,
  },
  theme: {
    brandColor: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR,
    accentColor: process.env.NEXT_PUBLIC_BRAND_ACCENT_COLOR,
  },
};
