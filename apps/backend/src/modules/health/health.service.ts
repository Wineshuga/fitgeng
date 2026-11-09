import type { HealthReport } from '@fitgeng/shared';
import { mongoStatus } from '../../config/database';
import { redisStatus } from '../../config/redis';

const version = process.env.npm_package_version ?? '0.1.0';

/**
 * MongoDB is required, so the service is 'down' without it. Redis is optional,
 * so losing it only makes the service 'degraded'.
 */
export function getHealth(): HealthReport {
  const mongo = mongoStatus();
  const redis = redisStatus();
  const status = mongo !== 'up' ? 'down' : redis === 'down' ? 'degraded' : 'ok';
  return {
    status,
    uptimeSeconds: Math.round(process.uptime()),
    version,
    dependencies: { mongo, redis },
  };
}
