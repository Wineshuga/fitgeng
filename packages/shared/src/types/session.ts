import type { Capability, OrgRole } from '../constants/capabilities';

export type OrganisationType = 'personal' | 'academy' | 'club' | 'community';

/**
 * The signed-in user as the frontend sees them. Returned by
 * GET /api/v1/auth/session (Phase 2). Contains no tokens or secrets, so it is
 * safe to render on the server and hand to client components.
 */
export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  capabilities: Capability[];
  isPlatformAdmin: boolean;
}

/** One organisation the user belongs to, with their role there. */
export interface SessionMembership {
  orgId: string;
  slug: string;
  name: string;
  type: OrganisationType;
  role: OrgRole;
  logoUrl?: string;
}

export interface Session {
  user: SessionUser;
  memberships: SessionMembership[];
}
