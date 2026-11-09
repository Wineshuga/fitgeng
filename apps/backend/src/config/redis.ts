import Redis from 'ioredis';
import type { DependencyStatus } from '@fitgeng/shared';
import { logger } from './logger';

/**
 * Redis is optional (architecture D11). Callers use `getRedis()`, which returns
 * a client only while it is connected. Otherwise they fall back to MongoDB or
 * in-memory behaviour. Commands are never queued while Redis is offline, so a
 * Redis outage cannot hang a request.
 */
let client: Redis | null = null;

export function connectRedis(url: string): Redis | null {
  if (!url) {
    logger.info('REDIS_URL not set; Redis features disabled');
    return null;
  }

  client = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 5_000,
    retryStrategy: (times) => Math.min(times * 500, 30_000),
  });

  let warned = false;
  client.on('ready', () => {
    warned = false;
    logger.info('Redis connected');
  });
  client.on('error', (err) => {
    if (!warned) logger.warn({ err: err.message }, 'Redis unavailable; continuing without cache');
    warned = true;
  });

  client.connect().catch(() => {
    /* reported via the 'error' handler; retryStrategy keeps trying */
  });
  return client;
}

/** The client if it is ready to accept commands, otherwise null. */
export function getRedis(): Redis | null {
  return client && client.status === 'ready' ? client : null;
}

export function redisStatus(): DependencyStatus {
  if (!client) return 'disabled';
  return client.status === 'ready' ? 'up' : 'down';
}

export async function disconnectRedis(): Promise<void> {
  if (!client) return;
  const c = client;
  client = null;
  await c.quit().catch(() => c.disconnect());
}
