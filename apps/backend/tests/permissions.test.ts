import express from 'express';
import request from 'supertest';
import { ALL_PERMISSIONS, PERMISSIONS, resolveOrgPermissions, type Capability, type OrgRole } from '@fitgeng/shared';
import { requireOrgPermission, type AccessContext } from '../src/middleware/authorize';
import { errorHandler } from '../src/middleware/errorHandler';

const family = (f: string) => ALL_PERMISSIONS.filter((p) => PERMISSIONS[p] === f);
const coaching = family('coaching');
const competition = family('competition');

describe('resolveOrgPermissions', () => {
  const caps = (...c: Capability[]) => c;

  it('gives an owner with both capabilities every permission', () => {
    expect(resolveOrgPermissions(caps('player', 'coach', 'organiser'), 'owner').sort()).toEqual([...ALL_PERMISSIONS].sort());
  });

  it('gives a coach-only owner coaching tools but no competition tools', () => {
    const p = resolveOrgPermissions(caps('player', 'coach'), 'owner');
    expect(p).toEqual(expect.arrayContaining([...coaching, 'players.manage', 'payments.manage', 'teams.manage']));
    competition.forEach((perm) => expect(p).not.toContain(perm));
  });

  it('gives an organiser-only owner competition tools but no coaching tools', () => {
    const p = resolveOrgPermissions(caps('player', 'organiser'), 'admin');
    expect(p).toEqual(expect.arrayContaining([...competition, 'events.manage', 'groups.manage']));
    coaching.forEach((perm) => expect(p).not.toContain(perm));
  });

  it('lets an org-appointed coach coach without the global capability, but not handle money or settings', () => {
    const p = resolveOrgPermissions(caps('player'), 'coach');
    expect(p).toEqual(expect.arrayContaining([...coaching, 'attendance.manage', 'sessions.manage']));
    expect(p).not.toContain('payments.manage');
    expect(p).not.toContain('org.settings');
    competition.forEach((perm) => expect(p).not.toContain(perm));
  });

  it('does not give competition admin to an org coach even if they are a global organiser', () => {
    const p = resolveOrgPermissions(caps('coach', 'organiser'), 'coach');
    competition.forEach((perm) => expect(p).not.toContain(perm));
  });

  it('keeps core access for an owner whose capabilities were revoked', () => {
    const p = resolveOrgPermissions(caps('player'), 'owner');
    expect(p).toContain('players.manage');
    [...coaching, ...competition].forEach((perm) => expect(p).not.toContain(perm));
  });
});

describe('requireOrgPermission middleware', () => {
  /** Test app: the access context comes from a header, standing in for authenticate + loadOrgContext. */
  function appWith(permission: Parameters<typeof requireOrgPermission>[0]) {
    const app = express();
    app.use((req, _res, next) => {
      const raw = req.header('x-test-access');
      if (raw) req.access = JSON.parse(raw) as AccessContext;
      next();
    });
    app.get('/orgs/:orgId/thing', requireOrgPermission(permission), (_req, res) => {
      res.json({ data: 'ok' });
    });
    app.use(errorHandler);
    return app;
  }

  const as = (capabilities: Capability[], role?: OrgRole): string =>
    JSON.stringify({ userId: 'u1', capabilities, membership: role ? { orgId: 'o1', role } : undefined });

  it('returns 401 when not signed in', async () => {
    const res = await request(appWith('players.manage')).get('/orgs/o1/thing');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it("returns 404 for another organisation's resources (not a member)", async () => {
    const res = await request(appWith('players.manage'))
      .get('/orgs/o1/thing')
      .set('x-test-access', as(['player', 'coach', 'organiser']));
    expect(res.status).toBe(404);
  });

  it('returns 403 when a member lacks the permission', async () => {
    const res = await request(appWith('competitions.manage'))
      .get('/orgs/o1/thing')
      .set('x-test-access', as(['player', 'coach'], 'owner'));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('blocks an org coach from payments', async () => {
    const res = await request(appWith('payments.manage')).get('/orgs/o1/thing').set('x-test-access', as(['player'], 'coach'));
    expect(res.status).toBe(403);
  });

  it('allows a member with the permission', async () => {
    const res = await request(appWith('competitions.manage'))
      .get('/orgs/o1/thing')
      .set('x-test-access', as(['player', 'organiser'], 'admin'));
    expect(res.status).toBe(200);
  });
});
