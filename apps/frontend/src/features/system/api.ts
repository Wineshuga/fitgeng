import type { ApiSuccess, HealthReport } from '@fitgeng/shared';
import { baseApi } from '@/services/baseApi';

export const systemApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHealth: build.query<HealthReport, void>({
      query: () => '/health',
      transformResponse: (res: ApiSuccess<HealthReport>) => res.data,
    }),
  }),
});

export const { useGetHealthQuery } = systemApi;
