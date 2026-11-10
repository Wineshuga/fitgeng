import type { SportDto } from '@fitgeng/shared';
import { cache as defaultCache, type Cache } from '../../services/cache';
import { ApiError } from '../../utils/ApiError';
import { Sport, type SportDoc } from './sport.model';

/** Cache namespace. Admin writes (Phase 2) must call invalidateSportsCache(). */
export const SPORTS_CACHE_NS = 'sports';
const TTL_SECONDS = 24 * 60 * 60;

function toDto(doc: SportDoc): SportDto {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    format: doc.format,
    sortOrder: doc.sortOrder,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function createSportService(cache: Cache = defaultCache) {
  return {
    /** Active sports in display order. Cached; falls back to MongoDB if Redis is unavailable. */
    async listActive(): Promise<SportDto[]> {
      const key = await cache.nsKey(SPORTS_CACHE_NS, 'active');
      return cache.wrap(key, TTL_SECONDS, async () => {
        const docs = await Sport.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean<SportDoc[]>();
        return docs.map(toDto);
      });
    },

    /** One active sport. Inactive or unknown sports return 404. */
    async getActiveBySlug(slug: string): Promise<SportDto> {
      const key = await cache.nsKey(SPORTS_CACHE_NS, `slug:${slug}`);
      const sport = await cache.wrap(key, TTL_SECONDS, async () => {
        const doc = await Sport.findOne({ slug, isActive: true }).lean<SportDoc>();
        return doc ? toDto(doc) : null;
      });
      if (!sport) throw ApiError.notFound('Sport');
      return sport;
    },

    async invalidateSportsCache(): Promise<void> {
      await cache.invalidate(SPORTS_CACHE_NS);
    },
  };
}

export const sportService = createSportService();
