/**
 * The only module that reads import.meta.env. Everything else imports from here,
 * which lets Jest swap in src/test/envStub.ts. Only VITE_* values are bundled,
 * so nothing secret belongs in them.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  isDev: import.meta.env.DEV,
  brand: {
    name: import.meta.env.VITE_BRAND_NAME,
    tagline: import.meta.env.VITE_BRAND_TAGLINE,
    supportEmail: import.meta.env.VITE_BRAND_SUPPORT_EMAIL,
    primaryColor: import.meta.env.VITE_BRAND_PRIMARY_COLOR,
    accentColor: import.meta.env.VITE_BRAND_ACCENT_COLOR,
    logoUrl: import.meta.env.VITE_BRAND_LOGO_URL,
  },
};
