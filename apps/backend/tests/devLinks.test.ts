import request from 'supertest';
import { createApp } from '../src/app';
import { outbox } from '../src/services/email';
import { User } from '../src/modules/users/user.model';
import { shouldExposeDevLinks } from '../src/modules/auth/devLinks';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db';

describe('shouldExposeDevLinks (security guard)', () => {
  it.each([
    [{ production: true, emailProvider: 'log' }, false],
    [{ production: true, emailProvider: 'memory' }, false],
    [{ production: true, emailProvider: 'sendgrid' }, false],
    [{ production: false, emailProvider: 'sendgrid' }, false], // real emails in dev: no need to expose
    [{ production: false, emailProvider: 'log' }, true],
    [{ production: false, emailProvider: 'memory' }, true],
  ])('%o -> %s', (options, expected) => {
    expect(shouldExposeDevLinks(options)).toBe(expected);
  });
});

describe('dev links in auth responses (non-production, emails not really sent)', () => {
  const app = createApp();
  const ada = { firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', password: 'correct horse battery' };
  const lastEmailLink = () => outbox.at(-1)!.text.match(/https?:\/\/\S+token=[A-Za-z0-9_-]+/)![0];

  beforeAll(startTestDb);
  beforeEach(async () => {
    await clearTestDb();
    await User.init();
    outbox.length = 0;
  });
  afterAll(stopTestDb);

  it('register returns exactly the link that was emailed, and it works', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    expect(res.body.data.devLink).toBe(lastEmailLink());
    const token = new URL(res.body.data.devLink).searchParams.get('token');
    await request(app).post('/api/v1/auth/verify-email').send({ token }).expect(200);
  });

  it('resend returns the new link', async () => {
    await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    const res = await request(app).post('/api/v1/auth/resend-verification').send({ email: ada.email }).expect(202);
    expect(res.body.data.devLink).toBe(lastEmailLink());
  });

  it('forgot-password returns the reset link', async () => {
    await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: ada.email }).expect(202);
    expect(res.body.data.devLink).toContain('/reset-password?token=');
    expect(res.body.data.devLink).toBe(lastEmailLink());
  });

  it('includes no link when no email was sent', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' }).expect(202);
    expect(res.body.data).toEqual({ message: expect.any(String) });
  });
});
