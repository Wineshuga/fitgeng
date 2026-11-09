import type Redis from 'ioredis';
import { createCache } from '../cache';

/** A minimal in-memory stand-in for the ioredis commands the cache uses. */
function fakeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    client: {
      get: jest.fn(async (k: string) => store.get(k) ?? null),
      set: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
        return 'OK';
      }),
      del: jest.fn(async (k: string) => Number(store.delete(k))),
      incr: jest.fn(async (k: string) => {
        const next = Number(store.get(k) ?? 0) + 1;
        store.set(k, String(next));
        return next;
      }),
    } as unknown as Redis,
  };
}

describe('cache service', () => {
  it('calls the loader every time when Redis is unavailable', async () => {
    const cache = createCache(() => null);
    const loader = jest.fn().mockResolvedValue({ n: 1 });

    expect(await cache.wrap('k', 60, loader)).toEqual({ n: 1 });
    expect(await cache.wrap('k', 60, loader)).toEqual({ n: 1 });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('falls back to the loader when a Redis command throws', async () => {
    const broken = {
      get: jest.fn().mockRejectedValue(new Error('ECONNRESET')),
      set: jest.fn().mockRejectedValue(new Error('ECONNRESET')),
    } as unknown as Redis;
    const cache = createCache(() => broken);
    const loader = jest.fn().mockResolvedValue('fresh');

    await expect(cache.wrap('k', 60, loader)).resolves.toBe('fresh');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('serves cached values on subsequent calls', async () => {
    const { client } = fakeRedis();
    const cache = createCache(() => client);
    const loader = jest.fn().mockResolvedValue([1, 2, 3]);

    await cache.wrap('list', 60, loader);
    expect(await cache.wrap('list', 60, loader)).toEqual([1, 2, 3]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('invalidates every key in a namespace by bumping its version', async () => {
    const { client } = fakeRedis();
    const cache = createCache(() => client);
    const loader = jest.fn().mockResolvedValueOnce('v1').mockResolvedValueOnce('v2');

    const k1 = await cache.nsKey('groups:public', 'page=1');
    expect(await cache.wrap(k1, 60, loader)).toBe('v1');

    await cache.invalidate('groups:public');
    const k2 = await cache.nsKey('groups:public', 'page=1');
    expect(k2).not.toBe(k1);
    expect(await cache.wrap(k2, 60, loader)).toBe('v2');
  });
});
