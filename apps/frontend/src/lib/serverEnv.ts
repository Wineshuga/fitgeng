import 'server-only';

/**
 * Server-only configuration. Never import this from client components: the
 * `server-only` import makes such a mistake a build error.
 */
export const serverEnv = {
  /** Express API as reached from the Next.js server (Docker: http://backend:4000/api/v1). Never sent to browsers. */
  internalApiUrl: (process.env.INTERNAL_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, ''),
};
