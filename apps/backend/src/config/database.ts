import mongoose from 'mongoose';
import type { DependencyStatus } from '@fitgeng/shared';
import { logger } from './logger';

// Reject unknown query fields and strip `$`-operators from user-supplied filter
// objects (blocks NoSQL operator injection such as { email: { $ne: null } }).
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB error'));

  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info({ host: conn.connection.host, db: conn.connection.name }, 'MongoDB connected');
  return conn;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function mongoStatus(): DependencyStatus {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected ? 'up' : 'down';
}
