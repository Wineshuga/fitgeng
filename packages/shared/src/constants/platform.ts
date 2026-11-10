export const DEFAULT_TIMEZONE = 'Africa/Lagos';
export const DEFAULT_CURRENCY = 'NGN';
export const API_PREFIX = '/api/v1';

/**
 * Cookie names shared by the API (which sets them) and the Next.js server
 * (which reads them to protect routes). The refresh token is HttpOnly and
 * opaque; the frontend only checks whether it is present.
 */
export const COOKIES = {
  refreshToken: 'fg_rt',
  /** Non-sensitive: slug of the organisation last opened in /manage. */
  lastOrg: 'fg_last_org',
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const;
