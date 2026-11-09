/** Jest replacement for src/config/env.ts (import.meta.env isn't available under Jest). */
export const env = {
  apiBaseUrl: 'http://localhost/api/v1',
  isDev: false,
  brand: {} as Record<string, string | undefined>,
};
