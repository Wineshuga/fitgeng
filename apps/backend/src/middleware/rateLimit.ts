import type { RequestHandler } from 'express';
import { rateLimit, type Options } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { ERROR_CODES } from '@fitgeng/shared';
import { getRedis } from '../config/redis';
import { ApiError } from '../utils/ApiError';

interface LimiterOptions {
  /** Distinguishes counters in Redis, e.g. "auth". */
  name: string;
  windowMs: number;
  limit: number;
}

/**
 * Rate limiter that shares counters across API instances through Redis, and
 * falls back to a per-process memory store whenever Redis is unavailable, so
 * limits still apply when the cache is down (architecture D11).
 */
export function createRateLimiter({ name, windowMs, limit }: LimiterOptions): RequestHandler {
  const base: Partial<Options> = {
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // The Redis-backed limiter is created on first use (when Redis is ready), not at import time.
    validate: { creationStack: false },
    handler: (_req, _res, next) =>
      next(new ApiError(429, ERROR_CODES.RATE_LIMITED, 'Too many requests. Please wait a moment and try again.')),
  };

  const memoryLimiter = rateLimit(base);
  let redisLimiter: RequestHandler | null = null;

  return (req, res, next) => {
    const client = getRedis();
    if (!client) return memoryLimiter(req, res, next);

    redisLimiter ??= rateLimit({
      ...base,
      // If Redis fails mid-request, allow the request rather than locking everyone out.
      passOnStoreError: true,
      store: new RedisStore({
        prefix: `fg:rl:${name}:`,
        sendCommand: (command: string, ...args: string[]) => client.call(command, ...args) as Promise<RedisReply>,
      }),
    });
    return redisLimiter(req, res, next);
  };
}
