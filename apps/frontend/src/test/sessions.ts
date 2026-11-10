import type { Capability, OrgRole, Session, SessionMembership } from '@fitgeng/shared';

/** Test-only session builders. The running app always gets sessions from the API. */
export function membership(slug: string, role: OrgRole, name = slug): SessionMembership {
  return { orgId: `id-${slug}`, slug, name, type: 'academy', role };
}

export function session(capabilities: Capability[], memberships: SessionMembership[] = []): Session {
  return {
    user: { id: 'u1', firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', capabilities, isPlatformAdmin: false },
    memberships,
  };
}
