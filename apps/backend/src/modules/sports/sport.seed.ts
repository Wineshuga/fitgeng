import type { SportFormat } from '@fitgeng/shared';
import { Sport } from './sport.model';

interface SeedSport {
  name: string;
  slug: string;
  format: SportFormat;
  sortOrder: number;
  description: string;
}

/** Launch sports from the product brief. More are added by platform admins. */
export const DEFAULT_SPORTS: readonly SeedSport[] = [
  {
    name: 'Lawn tennis',
    slug: 'tennis',
    format: 'individual',
    sortOrder: 10,
    description:
      'Singles and doubles racket sport played on hard, clay or grass courts. Find coaching for beginners through competitive players, regular hitting partners and club sessions.',
  },
  {
    name: 'Football',
    slug: 'football',
    format: 'team',
    sortOrder: 20,
    description:
      'Eleven-a-side and small-sided football. Join training groups and academies, find teams looking for players, and play friendlies and community games.',
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    format: 'team',
    sortOrder: 30,
    description:
      'Five-on-five and three-on-three basketball. Train skills and fitness with a coach, join a team, or find regular pickup runs.',
  },
  {
    name: 'Table tennis',
    slug: 'table-tennis',
    format: 'individual',
    sortOrder: 40,
    description:
      'Fast indoor racket sport for all ages. Improve technique with coached sessions, find practice partners and take part in club play.',
  },
  {
    name: 'Swimming',
    slug: 'swimming',
    format: 'individual',
    sortOrder: 50,
    description:
      'Learn-to-swim lessons, stroke improvement and squad training for children and adults, from first lessons to competitive swimming.',
  },
  {
    name: 'Padel',
    slug: 'padel',
    format: 'both',
    sortOrder: 60,
    description:
      'Doubles racket sport played on an enclosed court where the walls are in play. Easy to pick up and very social: find coaching, partners and games.',
  },
  {
    name: 'Badminton',
    slug: 'badminton',
    format: 'individual',
    sortOrder: 70,
    description:
      'Indoor racket sport played as singles or doubles. Join coached groups to build footwork and technique, or find regular games.',
  },
];

/**
 * Inserts any default sport that's missing. Existing sports are never modified,
 * so admin edits (including deactivation) survive restarts.
 * Safe to run on every startup.
 */
export async function ensureDefaultSports(): Promise<number> {
  const result = await Sport.bulkWrite(
    DEFAULT_SPORTS.map((s) => ({
      updateOne: { filter: { slug: s.slug }, update: { $setOnInsert: s }, upsert: true },
    })),
  );
  return result.upsertedCount;
}
