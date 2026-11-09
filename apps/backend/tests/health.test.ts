import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { startTestDb, stopTestDb } from './helpers/db';

describe('GET /api/v1/health', () => {
  const app = createApp();

  beforeAll(startTestDb);
  afterAll(stopTestDb);

  it('reports ok with Mongo up and Redis disabled', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: 'ok',
      dependencies: { mongo: 'up', redis: 'disabled' },
    });
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('reports down with 503 when Mongo is disconnected', async () => {
    await mongoose.disconnect();
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe('down');
    expect(res.body.data.dependencies.mongo).toBe('down');
  });
});
