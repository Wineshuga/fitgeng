import { MongoMemoryReplSet } from 'mongodb-memory-server';

/**
 * Starts one in-memory single-node replica set for the whole test run, so
 * transactions work as they do in production. Suites share the server but each
 * uses its own database (see tests/helpers/db.ts).
 */
export default async function globalSetup(): Promise<void> {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  (globalThis as { __MONGO_REPLSET__?: MongoMemoryReplSet }).__MONGO_REPLSET__ = replSet;
  process.env.MONGO_TEST_URI = replSet.getUri();
}
