import { z } from 'zod';

export const SPORT_FORMATS = ['individual', 'team', 'both'] as const;
export type SportFormat = (typeof SPORT_FORMATS)[number];

/** URL-safe sport identifier, e.g. "table-tennis". */
export const sportSlugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid sport slug');

export const sportSlugParamsSchema = z.object({ slug: sportSlugSchema }).strict();

/** Public representation of a sport (GET /sports, GET /sports/:slug). */
export interface SportDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  format: SportFormat;
  sortOrder: number;
  updatedAt: string;
}
