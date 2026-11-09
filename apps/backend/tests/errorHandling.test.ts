import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { z } from 'zod';
import { createApp } from '../src/app';
import { validate } from '../src/middleware/validate';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import { ApiError } from '../src/utils/ApiError';
import { startTestDb, stopTestDb } from './helpers/db';

/** A small app that reuses the real middleware to exercise each error path. */
function buildTestApp() {
  const app = express();
  app.use(express.json({ limit: '1kb' }));

  const body = z.object({ name: z.string().min(2) }).strict();
  app.post('/echo', validate({ body }), (req, res) => {
    res.json({ data: req.validated.body });
  });
  app.get('/forbidden', () => {
    throw ApiError.forbidden();
  });
  app.get('/boom', () => {
    throw new Error('database password is hunter2');
  });

  const Thing = mongoose.model('Thing', new mongoose.Schema({ code: { type: String, unique: true } }));
  app.post('/things', async (req, res) => {
    const thing = await Thing.create({ code: req.body.code });
    res.status(201).json({ data: thing });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return { app, Thing };
}

describe('error handling and response envelope', () => {
  const { app, Thing } = buildTestApp();

  beforeAll(async () => {
    await startTestDb();
    await Thing.init(); // build the unique index
  });
  afterAll(stopTestDb);

  it('passes only validated output to handlers', async () => {
    const res = await request(app).post('/echo').send({ name: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { name: 'Ada' } });
  });

  it('rejects unknown fields (mass-assignment protection) with details', async () => {
    const res = await request(app).post('/echo').send({ name: 'Ada', isPlatformAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ path: '' })]));
  });

  it('returns field-level validation errors', async () => {
    const res = await request(app).post('/echo').send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('name');
  });

  it('maps ApiError to its status and code', async () => {
    const res = await request(app).get('/forbidden');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('hides internal error messages behind a generic 500', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });

  it('maps duplicate-key errors to 409', async () => {
    await request(app).post('/things').send({ code: 'X1' }).expect(201);
    const res = await request(app).post('/things').send({ code: 'X1' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('maps oversized bodies to 413', async () => {
    const res = await request(app).post('/echo').send({ name: 'x'.repeat(2000) });
    expect(res.status).toBe(413);
  });

  describe('real app', () => {
    const realApp = createApp();

    it('returns 404 envelope for unknown routes', async () => {
      const res = await request(realApp).get('/api/v1/does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatchObject({ code: 'NOT_FOUND' });
      expect(res.body.error.requestId).toBeDefined();
    });

    it('returns 400 for malformed JSON', async () => {
      const res = await request(realApp)
        .post('/api/v1/health')
        .set('Content-Type', 'application/json')
        .send('{"bad json');
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Malformed JSON body');
    });

    it('sets security headers and hides x-powered-by', async () => {
      const res = await request(realApp).get('/api/v1/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
