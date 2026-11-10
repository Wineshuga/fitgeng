import type { Server } from 'node:http';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongo, disconnectMongo } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { createApp } from './app';
import { ensureDefaultSports } from './modules/sports/sport.seed';

async function main() {
  await connectMongo(env.MONGO_URI);
  connectRedis(env.REDIS_URL); // Not awaited: the API starts even if Redis is unreachable.

  // Reference data: inserts missing default sports, never changes existing ones.
  const added = await ensureDefaultSports();
  if (added > 0) logger.info({ added }, 'Seeded default sports');

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(async () => {
      await Promise.allSettled([disconnectMongo(), disconnectRedis()]);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start API');
  process.exit(1);
});
