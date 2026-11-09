import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@/config/env';

/**
 * The single RTK Query API. Feature modules add their endpoints with
 * `baseApi.injectEndpoints` (see features/<name>/api.ts). Phase 2 wraps this base
 * query with access-token headers and a refresh-on-401 mutex.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiBaseUrl,
    credentials: 'include',
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
