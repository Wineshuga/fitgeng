import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { ApiSuccess, AuthTokenResponse } from '@fitgeng/shared';
import { env } from '@/config/env';
import { credentialsReceived, loggedOut, type AuthState } from '@/store/authSlice';

/** Header the API requires on cookie-reading, state-changing endpoints (CSRF guard). */
export const CSRF_HEADERS = { 'X-Requested-With': 'fitgeng' } as const;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  // Same-origin requests carry the HttpOnly refresh cookie; JS never sees it.
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: AuthState }).auth.accessToken;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

const urlOf = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

/** Shared by every request in the tab, so concurrent 401s trigger a single refresh. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Base query with silent re-authentication. On a 401 from a non-auth endpoint,
 * it calls POST /auth/refresh once (the refresh cookie is rotated
 * server-side), stores the new access token and retries the original request.
 * If the refresh fails, the user is signed out. Auth endpoints are never retried,
 * which prevents loops.
 */
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);
  if (result.error?.status !== 401 || urlOf(args).startsWith('/auth/')) return result;

  refreshInFlight ??= (async () => {
    const refreshed = await rawBaseQuery({ url: '/auth/refresh', method: 'POST', headers: CSRF_HEADERS }, api, extra);
    if (refreshed.data) {
      api.dispatch(credentialsReceived((refreshed.data as ApiSuccess<AuthTokenResponse>).data));
      return true;
    }
    api.dispatch(loggedOut());
    return false;
  })().finally(() => {
    refreshInFlight = null;
  });

  if (await refreshInFlight) result = await rawBaseQuery(args, api, extra);
  return result;
};

/**
 * The single RTK Query API. Feature modules add endpoints with
 * `baseApi.injectEndpoints` (features/<name>/api.ts).
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me'],
  endpoints: () => ({}),
});
