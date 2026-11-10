import 'server-only';
import { cache } from 'react';
import type { SportDto, SportFormat } from '@fitgeng/shared';
import { apiGet } from '@/lib/api/server';

/** Revalidation windows: the catalogue changes rarely. */
export const SPORTS_LIST_REVALIDATE = 300;
export const SPORT_PAGE_REVALIDATE = 3600;

/** Active sports, or [] when the API returns none. Deduplicated per request. */
export const getSports = cache(
  async (): Promise<SportDto[]> => (await apiGet<SportDto[]>('/sports', { revalidate: SPORTS_LIST_REVALIDATE, tags: ['sports'] })) ?? [],
);

/** One sport, or null if unknown or inactive. Deduplicated per request (metadata + page). */
export const getSport = cache(
  (slug: string): Promise<SportDto | null> =>
    apiGet<SportDto>(`/sports/${encodeURIComponent(slug)}`, { revalidate: SPORT_PAGE_REVALIDATE, tags: ['sports', `sport:${slug}`] }),
);

export const FORMAT_LABEL: Record<SportFormat, string> = {
  individual: 'Individual sport',
  team: 'Team sport',
  both: 'Played individually or in teams',
};
