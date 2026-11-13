import type { MetadataRoute } from 'next';
import type { SportDto } from '@fitgeng/shared';
import { getSports } from '@/features/sports/server';
import { absoluteUrl } from '@/lib/seo/metadata';

/**
 * Rendered per request, never at build time: an image build can't reach the
 * API, and a prerendered sitemap would then list only the static pages until it
 * regenerated. The API data is still cached for 5 minutes (getSports), so this
 * stays cheap. New public entities (coaches, communities, events) are added
 * here as their pages ship.
 */
export const dynamic = 'force-dynamic';

/**
 * Public, indexable URLs only. Private areas (/manage, /player), account pages
 * and the API are never listed. Data comes from public API endpoints, which
 * already exclude inactive or private records.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/sports'), changeFrequency: 'weekly', priority: 0.8 },
  ];

  let sports: SportDto[] = [];
  try {
    sports = await getSports();
  } catch {
    // API unavailable: serve the static entries now and pick up sports on the next regeneration.
  }

  return [
    ...staticPages,
    ...sports.map((s) => ({
      url: absoluteUrl(`/sports/${s.slug}`),
      lastModified: new Date(s.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
