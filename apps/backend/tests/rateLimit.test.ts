import express from 'express';
import request from 'supertest';
import { createRateLimiter } from '../src/middleware/rateLimit';
import { errorHandler } from '../src/middleware/errorHandler';

describe('rate limiter', () => {
  function appWithLimit(limit: number) {
    const app = express();
    app.post('/login', createRateLimiter({ name: 'test', windowMs: 60_000, limit }), (_req, res) => {
      res.json({ data: 'ok' });
    });
    app.use(errorHandler);
    return app;
  }

  it('limits requests even without Redis (in-memory fallback) and answers in the error envelope', async () => {
    const app = appWithLimit(3); // REDIS_URL is empty in tests, so the memory store is used
    for (let i = 0; i < 3; i++) await request(app).post('/login').expect(200);
    const blocked = await request(app).post('/login');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.headers['ratelimit-policy'] ?? blocked.headers['ratelimit']).toBeDefined();
  });
});
