import { randomUUID } from 'node:crypto';
import os from 'node:os';
import mongoose from 'mongoose';

/**
 * MongoDB driver 7.x loads `os` with a dynamic `import()`, which Jest's VM sandbox
 * rejects. The handshake then goes out without client metadata and the server
 * refuses it. Passing the adapter directly avoids that import. Tests only:
 * production runs outside the sandbox and doesn't need this.
 */
const testClientOptions = { runtimeAdapters: { os } };

/**
 * Connects mongoose to the shared in-memory replica set started in globalSetup,
 * using a fresh database per suite so suites running in parallel stay isolated.
 */
export async function startTestDb(): Promise<void> {
  const uri = process.env.MONGO_TEST_URI;
  if (!uri) throw new Error('MONGO_TEST_URI not set; is jest globalSetup configured?');
  await mongoose.connect(uri, { dbName: `test-${randomUUID()}`, ...testClientOptions });
}

export async function clearTestDb(): Promise<void> {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function stopTestDb(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
}
