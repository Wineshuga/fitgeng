import type Redis from 'ioredis';
import { getRedis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Cache-aside helper (architecture §6.2). Every operation is best-effort: if
 * Redis is missing or a command fails, reads count as misses and writes are
 * skipped, so callers always fall back to their loader (normally MongoDB).
 *
 * Invalidation uses namespace versions. Cached keys include the current version
 * of their namespace, and bumping the version makes every key in it stale at
 * once, with no SCAN or KEYS calls.
 */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T>;
  /** Builds a key scoped to the current version of `namespace`. */
  nsKey(namespace: string, key: string): Promise<string>;
  /** Invalidates every key built with nsKey(namespace, …). */
  invalidate(namespace: string): Promise<void>;
}

const PREFIX = 'fg:';
const WARN_INTERVAL_MS = 60_000;

export function createCache(getClient: () => Redis | null = getRedis): Cache {
  let lastWarn = 0;
  const warn = (op: string, err: unknown) => {
    const now = Date.now();
    if (now - lastWarn > WARN_INTERVAL_MS) {
      lastWarn = now;
      logger.warn({ op, err: (err as Error)?.message }, 'Cache operation failed; falling back');
    }
  };

  async function safe<T>(op: string, fn: (r: Redis) => Promise<T>, fallback: T): Promise<T> {
    const client = getClient();
    if (!client) return fallback;
    try {
      return await fn(client);
    } catch (err) {
      warn(op, err);
      return fallback;
    }
  }

  const cache: Cache = {
    async get<T>(key: string) {
      const raw = await safe('get', (r) => r.get(PREFIX + key), null);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },

    async set(key, value, ttlSeconds) {
      await safe('set', (r) => r.set(PREFIX + key, JSON.stringify(value), 'EX', ttlSeconds), null);
    },

    async del(key) {
      await safe('del', (r) => r.del(PREFIX + key), 0);
    },

    async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>) {
      const hit = await cache.get<T>(key);
      if (hit !== null) return hit;
      const value = await loader();
      if (value !== undefined && value !== null) await cache.set(key, value, ttlSeconds);
      return value;
    },

    async nsKey(namespace, key) {
      const version = await safe('nsKey', (r) => r.get(`${PREFIX}ns:${namespace}`), null);
      return `${namespace}:v${version ?? '0'}:${key}`;
    },

    async invalidate(namespace) {
      await safe('invalidate', (r) => r.incr(`${PREFIX}ns:${namespace}`), 0);
    },
  };
  return cache;
}

export const cache = createCache();
