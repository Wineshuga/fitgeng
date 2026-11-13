import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../src/app';
import { outbox } from '../src/services/email';
import { User } from '../src/modules/users/user.model';
import { PlayerProfile } from '../src/modules/users/playerProfile.model';
import { RefreshToken } from '../src/modules/auth/token.models';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db';

const app = createApp();
const CSRF = { 'X-Requested-With': 'fitgeng' };
const ada = { firstName: 'Ada', lastName: 'Obi', email: 'Ada@Example.com', password: 'correct horse battery' };

/** Pulls the token out of the latest email's link (?token=...). */
function tokenFromEmail(index = -1): string {
  const mail = outbox.at(index);
  const match = mail?.text.match(/token=([A-Za-z0-9_-]+)/);
  if (!match) throw new Error(`No token link in email: ${mail?.subject}`);
  return match[1]!;
}

/** The fg_rt value from a response's Set-Cookie header. */
function refreshCookie(res: request.Response): string | undefined {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  return cookies.find((c) => c.startsWith('fg_rt='))?.split(';')[0]?.slice('fg_rt='.length) || undefined;
}

async function registerAndVerify(user = ada) {
  await request(app).post('/api/v1/auth/register').send(user).expect(202);
  await request(app).post('/api/v1/auth/verify-email').send({ token: tokenFromEmail() }).expect(200);
}

async function login(email = ada.email, password = ada.password) {
  return request(app).post('/api/v1/auth/login').send({ email, password });
}

beforeAll(startTestDb);
beforeEach(async () => {
  await clearTestDb();
  await Promise.all([User.init(), RefreshToken.init()]);
  outbox.length = 0;
});
afterAll(stopTestDb);

describe('registration and email verification', () => {
  it('creates a player account and profile, normalises the email, and sends a verification link', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(ada);
    expect(res.status).toBe(202);
    // Tests use the in-memory email provider, so the dev-only link is included (see devLinks tests).
    expect(res.body.data).toEqual({ message: expect.any(String), devLink: expect.stringContaining('/verify-email?token=') });
    expect(res.headers['set-cookie']).toBeUndefined(); // no session before verification

    const user = await User.findOne({ email: 'ada@example.com' }).select('+passwordHash').lean();
    expect(user).toMatchObject({ capabilities: ['player'], emailVerifiedAt: null, isPlatformAdmin: false });
    expect(user!.passwordHash).toMatch(/^\$argon2id\$/);
    expect(await PlayerProfile.countDocuments({ userId: user!._id })).toBe(1);

    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ to: 'ada@example.com', subject: expect.stringContaining('Verify') });
    expect(outbox[0]!.text).toContain('http://localhost:3000/verify-email?token=');
  });

  it('rejects weak passwords and unknown fields (mass assignment)', async () => {
    const weak = await request(app).post('/api/v1/auth/register').send({ ...ada, password: 'short' });
    expect(weak.status).toBe(400);
    const sneaky = await request(app).post('/api/v1/auth/register').send({ ...ada, isPlatformAdmin: true, capabilities: ['coach'] });
    expect(sneaky.status).toBe(400);
    expect(await User.countDocuments()).toBe(0);
  });

  it('does not reveal whether an email is registered', async () => {
    await registerAndVerify();
    outbox.length = 0;
    const again = await request(app).post('/api/v1/auth/register').send({ ...ada, firstName: 'Mallory' });
    expect(again.status).toBe(202);
    expect(await User.countDocuments()).toBe(1);
    // The real owner is told someone tried; no second account is created.
    expect(outbox[0]?.subject).toMatch(/already have/i);
  });

  it('verifies with a single-use link', async () => {
    await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    const token = tokenFromEmail();
    await request(app).post('/api/v1/auth/verify-email').send({ token }).expect(200);
    expect((await User.findOne({ email: 'ada@example.com' }))!.emailVerifiedAt).toBeInstanceOf(Date);

    const reuse = await request(app).post('/api/v1/auth/verify-email').send({ token });
    expect(reuse.status).toBe(400);
  });

  it('invalidates older verification links when a new one is requested', async () => {
    await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    const first = tokenFromEmail();
    await request(app).post('/api/v1/auth/resend-verification').send({ email: ada.email }).expect(202);
    expect((await request(app).post('/api/v1/auth/verify-email').send({ token: first })).status).toBe(400);
    expect((await request(app).post('/api/v1/auth/verify-email').send({ token: tokenFromEmail() })).status).toBe(200);
  });

  it('answers resend requests identically for unknown emails', async () => {
    const res = await request(app).post('/api/v1/auth/resend-verification').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(202);
    expect(outbox).toHaveLength(0);
  });
});

describe('login', () => {
  it('refuses unverified accounts with a specific code', async () => {
    await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    const res = await login();
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('gives the same error for a wrong password and an unknown email', async () => {
    await registerAndVerify();
    const wrong = await login(ada.email, 'wrong password!!');
    const unknown = await login('ghost@example.com', ada.password);
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('returns an access token in the body and the refresh token only as an HttpOnly cookie', async () => {
    await registerAndVerify();
    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      accessToken: expect.any(String),
      expiresIn: 900,
      user: expect.objectContaining({ email: 'ada@example.com', capabilities: ['player'], emailVerified: true }),
    });
    expect(JSON.stringify(res.body)).not.toContain(refreshCookie(res)!);
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('fg_rt='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(res.headers['cache-control']).toBe('no-store');

    const claims = jwt.decode(res.body.data.accessToken) as jwt.JwtPayload;
    expect(claims).toMatchObject({ iss: 'fitgeng-api', aud: 'fitgeng', tv: 0, caps: ['player'] });
  });

  it('refuses suspended accounts', async () => {
    await registerAndVerify();
    await User.updateOne({ email: 'ada@example.com' }, { status: 'suspended' });
    const res = await login();
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('authenticate middleware (GET /me)', () => {
  it('accepts a valid Bearer token', async () => {
    await registerAndVerify();
    const { body } = await login();
    const res = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ada@example.com');
  });

  it('rejects missing, forged and expired tokens', async () => {
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', tv: 0, caps: [] }, 'not-the-secret', { issuer: 'fitgeng-api', audience: 'fitgeng' });
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${forged}`)).status).toBe(401);

    await registerAndVerify();
    const user = await User.findOne({ email: 'ada@example.com' });
    const expired = jwt.sign({ sub: String(user!._id), tv: 0, caps: [] }, process.env.JWT_ACCESS_SECRET!, {
      issuer: 'fitgeng-api',
      audience: 'fitgeng',
      expiresIn: -10,
    });
    const res = await request(app).get('/api/v1/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects tokens immediately after suspension (user is re-read each request)', async () => {
    await registerAndVerify();
    const { body } = await login();
    await User.updateOne({ email: 'ada@example.com' }, { status: 'suspended' });
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${body.data.accessToken}`)).status).toBe(401);
  });
});

describe('refresh token rotation', () => {
  it('requires the CSRF header', async () => {
    await registerAndVerify();
    const rt = refreshCookie(await login());
    const res = await request(app).post('/api/v1/auth/refresh').set('Cookie', `fg_rt=${rt}`);
    expect(res.status).toBe(403);
  });

  it('rejects foreign origins', async () => {
    await registerAndVerify();
    const rt = refreshCookie(await login());
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set(CSRF)
      .set('Origin', 'https://evil.example')
      .set('Cookie', `fg_rt=${rt}`);
    expect(res.status).toBe(403);
  });

  it('rotates: issues a new token and access token, and revokes the old one', async () => {
    await registerAndVerify();
    const rt1 = refreshCookie(await login())!;
    const res = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Origin', 'http://localhost:3000').set('Cookie', `fg_rt=${rt1}`);
    expect(res.status).toBe(200);
    const rt2 = refreshCookie(res)!;
    expect(rt2).toBeDefined();
    expect(rt2).not.toBe(rt1);
    expect(res.body.data.accessToken).toEqual(expect.any(String));

    const docs = await RefreshToken.find().sort({ createdAt: 1 }).lean();
    expect(docs).toHaveLength(2);
    expect(docs[0]!.revokedAt).toBeInstanceOf(Date);
    expect(String(docs[0]!.replacedBy)).toBe(String(docs[1]!._id));
    expect(docs[0]!.familyId).toBe(docs[1]!.familyId);
  });

  it('treats reuse of a rotated token (after the grace window) as theft and revokes the whole family', async () => {
    await registerAndVerify();
    const rt1 = refreshCookie(await login())!;
    const rotated = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt1}`);
    const rt2 = refreshCookie(rotated)!;

    // Pretend the rotation happened a minute ago, so the concurrency grace window has passed.
    await RefreshToken.updateMany({ replacedBy: mongoose.trusted({ $ne: null }) as never }, { revokedAt: new Date(Date.now() - 60_000) });

    const reuse = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt1}`);
    expect(reuse.status).toBe(401);
    // The legitimate newer token is now dead too.
    const afterTheft = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt2}`);
    expect(afterTheft.status).toBe(401);
    expect(await RefreshToken.countDocuments({ revokedAt: null })).toBe(0);
  });

  it('does not punish a concurrent duplicate refresh inside the grace window', async () => {
    await registerAndVerify();
    const rt1 = refreshCookie(await login())!;
    const first = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt1}`);
    const rt2 = refreshCookie(first)!;
    const duplicate = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt1}`);
    expect(duplicate.status).toBe(401);
    // The newer token still works.
    expect((await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt2}`)).status).toBe(200);
  });

  it('rejects expired refresh tokens and clears the cookie', async () => {
    await registerAndVerify();
    const rt = refreshCookie(await login())!;
    await RefreshToken.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    const res = await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt}`);
    expect(res.status).toBe(401);
    expect(([] as string[]).concat(res.headers['set-cookie'] ?? []).some((c) => /^fg_rt=;/.test(c))).toBe(true);
  });
});

describe('GET /auth/session (non-rotating, for server rendering)', () => {
  it('returns the session without rotating or exposing tokens', async () => {
    await registerAndVerify();
    const rt = refreshCookie(await login())!;
    const res = await request(app).get('/api/v1/auth/session').set('Cookie', `fg_rt=${rt}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      user: { id: expect.any(String), firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', capabilities: ['player'], isPlatformAdmin: false },
      memberships: [],
    });
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/token/i);
    expect(await RefreshToken.countDocuments({ revokedAt: null })).toBe(1);
  });

  it('returns 401 without a cookie, with a forged cookie, or after logout', async () => {
    expect((await request(app).get('/api/v1/auth/session')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/session').set('Cookie', 'fg_rt=forged')).status).toBe(401);

    await registerAndVerify();
    const rt = refreshCookie(await login())!;
    await request(app).post('/api/v1/auth/logout').set(CSRF).set('Cookie', `fg_rt=${rt}`).expect(204);
    expect((await request(app).get('/api/v1/auth/session').set('Cookie', `fg_rt=${rt}`)).status).toBe(401);
  });
});

describe('logout', () => {
  it('requires the CSRF header, revokes the sign-in and clears the cookie', async () => {
    await registerAndVerify();
    const rt = refreshCookie(await login())!;
    expect((await request(app).post('/api/v1/auth/logout').set('Cookie', `fg_rt=${rt}`)).status).toBe(403);

    const res = await request(app).post('/api/v1/auth/logout').set(CSRF).set('Cookie', `fg_rt=${rt}`);
    expect(res.status).toBe(204);
    expect(([] as string[]).concat(res.headers['set-cookie'] ?? []).some((c) => /^fg_rt=;/.test(c))).toBe(true);
    expect((await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt}`)).status).toBe(401);
  });

  it('only ends that device, not other sign-ins', async () => {
    await registerAndVerify();
    const phone = refreshCookie(await login())!;
    const laptop = refreshCookie(await login())!;
    await request(app).post('/api/v1/auth/logout').set(CSRF).set('Cookie', `fg_rt=${phone}`).expect(204);
    expect((await request(app).get('/api/v1/auth/session').set('Cookie', `fg_rt=${laptop}`)).status).toBe(200);
  });
});

describe('password reset', () => {
  it('answers identically for unknown emails and sends nothing', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'ghost@example.com' });
    expect(res.status).toBe(202);
    expect(outbox).toHaveLength(0);
  });

  it('resets the password and signs out every device and access token', async () => {
    await registerAndVerify();
    const { body } = await login();
    const rt = refreshCookie(await login())!;
    outbox.length = 0;

    await request(app).post('/api/v1/auth/forgot-password').send({ email: ada.email }).expect(202);
    expect(outbox[0]!.text).toContain('/reset-password?token=');
    await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: tokenFromEmail(), password: 'a brand new passphrase' })
      .expect(200);

    expect((await login()).status).toBe(401); // old password
    expect((await login(ada.email, 'a brand new passphrase')).status).toBe(200);
    expect((await request(app).post('/api/v1/auth/refresh').set(CSRF).set('Cookie', `fg_rt=${rt}`)).status).toBe(401);
    // tokenVersion bumped: the old access token is dead even though it hasn't expired.
    expect((await request(app).get('/api/v1/me').set('Authorization', `Bearer ${body.data.accessToken}`)).status).toBe(401);
  });

  it('rejects reused or expired reset links', async () => {
    await registerAndVerify();
    await request(app).post('/api/v1/auth/forgot-password').send({ email: ada.email }).expect(202);
    const token = tokenFromEmail();
    await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'first new passphrase' }).expect(200);
    const reuse = await request(app).post('/api/v1/auth/reset-password').send({ token, password: 'second new passphrase' });
    expect(reuse.status).toBe(400);
  });

  it('verifies the email of an unverified user who completes a reset (proves ownership)', async () => {
    await request(app).post('/api/v1/auth/register').send(ada).expect(202);
    await request(app).post('/api/v1/auth/forgot-password').send({ email: ada.email }).expect(202);
    await request(app).post('/api/v1/auth/reset-password').send({ token: tokenFromEmail(), password: 'a brand new passphrase' }).expect(200);
    expect((await login(ada.email, 'a brand new passphrase')).status).toBe(200);
  });
});
