import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import {
  COOKIES,
  resolveOrgPermissions,
  type ApiSuccess,
  type Permission,
  type Session,
  type SessionMembership,
} from '@fitgeng/shared';
import { serverEnv } from '@/lib/serverEnv';

/**
 * The signed-in user, resolved on the server for this request.
 *
 * Asks Express (GET /auth/session, Phase 2) to validate the HttpOnly refresh
 * cookie without rotating it. Returns null when there is no cookie, the session
 * is invalid, or the API can't be reached; protected pages then send the user
 * to /login. React `cache` makes layouts and pages share one lookup per request.
 *
 * Nothing here returns or renders a token.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const refresh = (await cookies()).get(COOKIES.refreshToken);
  if (!refresh) return null;

  try {
    const res = await fetch(`${serverEnv.internalApiUrl}/auth/session`, {
      headers: { cookie: `${COOKIES.refreshToken}=${refresh.value}`, 'x-requested-with': 'fitgeng' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return ((await res.json()) as ApiSuccess<Session>).data;
  } catch {
    return null;
  }
});

/** Session or a redirect to /login (with a same-site return path). */
export async function requireSession(returnTo: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}

export interface ManageContext {
  session: Session;
  membership: SessionMembership;
  permissions: Permission[];
}

/**
 * Access to one organisation's management area. Not a member: 404 (the
 * organisation isn't revealed). Permissions come from the same shared rules
 * the API enforces. The API stays the authority for every request.
 */
export async function requireManageContext(orgSlug: string): Promise<ManageContext> {
  const session = await requireSession(`/manage/${orgSlug}`);
  const membership = session.memberships.find((m) => m.slug === orgSlug);
  if (!membership) notFound();
  return {
    session,
    membership,
    permissions: resolveOrgPermissions(session.user.capabilities, membership.role),
  };
}
