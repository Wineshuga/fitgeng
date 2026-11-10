import request from 'supertest';
import type Redis from 'ioredis';
import { createApp } from '../src/app';
import { Sport } from '../src/modules/sports/sport.model';
import { DEFAULT_SPORTS, ensureDefaultSports } from '../src/modules/sports/sport.seed';
import { createSportService } from '../src/modules/sports/sport.service';
import { createCache } from '../src/services/cache';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db';

describe('sports catalogue', () => {
  const app = createApp();

  beforeAll(async () => {
    await startTestDb();
    await Sport.init();
  });
  beforeEach(async () => {
    await clearTestDb();
    await ensureDefaultSports();
  });
  afterAll(stopTestDb);

  describe('seed', () => {
    it('inserts the launch sports once and is idempotent', async () => {
      expect(await Sport.countDocuments()).toBe(DEFAULT_SPORTS.length);
      expect(await ensureDefaultSports()).toBe(0);
      expect(await Sport.countDocuments()).toBe(DEFAULT_SPORTS.length);
    });

    it('never overwrites admin changes such as deactivation or renaming', async () => {
      await Sport.updateOne({ slug: 'padel' }, { isActive: false, name: 'Padel tennis' });
      await ensureDefaultSports();
      const padel = await Sport.findOne({ slug: 'padel' }).lean();
      expect(padel).toMatchObject({ isActive: false, name: 'Padel tennis' });
    });
  });

  describe('GET /api/v1/sports', () => {
    it('lists active sports in display order with public cache headers', async () => {
      const res = await request(app).get('/api/v1/sports');
      expect(res.status).toBe(200);
      expect(res.body.data.map((s: { slug: string }) => s.slug)).toEqual(DEFAULT_SPORTS.map((s) => s.slug));
      expect(res.body.data[0]).toEqual({
        id: expect.any(String),
        name: 'Lawn tennis',
        slug: 'tennis',
        description: expect.any(String),
        format: 'individual',
        sortOrder: 10,
        updatedAt: expect.any(String),
      });
      expect(res.headers['cache-control']).toContain('public');
    });

    it('hides inactive sports', async () => {
      await Sport.updateOne({ slug: 'badminton' }, { isActive: false });
      const res = await request(app).get('/api/v1/sports');
      expect(res.body.data.map((s: { slug: string }) => s.slug)).not.toContain('badminton');
    });

    it('does not expose internal fields', async () => {
      const res = await request(app).get('/api/v1/sports');
      expect(res.body.data[0]).not.toHaveProperty('_id');
      expect(res.body.data[0]).not.toHaveProperty('isActive');
    });
  });

  describe('GET /api/v1/sports/:slug', () => {
    it('returns one sport', async () => {
      const res = await request(app).get('/api/v1/sports/table-tennis');
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ name: 'Table tennis', format: 'individual' });
    });

    it('returns 404 for unknown and inactive sports', async () => {
      await Sport.updateOne({ slug: 'swimming' }, { isActive: false });
      expect((await request(app).get('/api/v1/sports/curling')).status).toBe(404);
      expect((await request(app).get('/api/v1/sports/swimming')).status).toBe(404);
    });

    it('rejects malformed slugs with 400', async () => {
      const res = await request(app).get('/api/v1/sports/Not_A_Slug');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('caching', () => {
    function memoryRedis() {
      const store = new Map<string, string>();
      return {
        get: jest.fn(async (k: string) => store.get(k) ?? null),
        set: jest.fn(async (k: string, v: string) => (store.set(k, v), 'OK')),
        del: jest.fn(async (k: string) => Number(store.delete(k))),
        incr: jest.fn(async (k: string) => {
          const n = Number(store.get(k) ?? 0) + 1;
          store.set(k, String(n));
          return n;
        }),
      } as unknown as Redis;
    }

    it('serves the list from cache until invalidated', async () => {
      const redis = memoryRedis();
      const cached = createSportService(createCache(() => redis));

      expect(await cached.listActive()).toHaveLength(DEFAULT_SPORTS.length);
      await Sport.updateOne({ slug: 'football' }, { isActive: false });
      expect(await cached.listActive()).toHaveLength(DEFAULT_SPORTS.length); // still cached

      await cached.invalidateSportsCache();
      expect(await cached.listActive()).toHaveLength(DEFAULT_SPORTS.length - 1);
    });

    it('works straight from MongoDB when Redis is unavailable', async () => {
      const uncached = createSportService(createCache(() => null));
      await Sport.updateOne({ slug: 'football' }, { isActive: false });
      expect(await uncached.listActive()).toHaveLength(DEFAULT_SPORTS.length - 1);
    });
  });
});
