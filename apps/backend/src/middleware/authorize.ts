import type { NextFunction, Request, Response } from 'express';
import { hasOrgPermission, type Capability, type OrgRole, type Permission } from '@fitgeng/shared';
import { ApiError } from '../utils/ApiError';

/**
 * Who is calling and what they are to the organisation in the URL.
 *
 * Filled in by two upstream middlewares:
 *   - authenticate (Phase 2): verifies the access token and sets userId + capabilities
 *     (re-read from the database for sensitive routes, so revocation is immediate)
 *   - loadOrgContext (Phase 3a): loads the caller's OrganisationMember for :orgId,
 *     or leaves `membership` undefined when they don't belong to it
 */
export interface AccessContext {
  userId: string;
  capabilities: Capability[];
  isPlatformAdmin?: boolean;
  membership?: { orgId: string; role: OrgRole };
}

declare module 'express-serve-static-core' {
  interface Request {
    access?: AccessContext;
  }
}

/**
 * Route guard for management APIs. It uses the same shared permission rules as
 * the frontend navigation, but decides independently: hiding a menu item never
 * grants or denies anything.
 *
 *   router.post('/orgs/:orgId/payments', requireOrgPermission('payments.manage'), controller.record)
 *
 * - not signed in: 401
 * - not a member of the organisation: 404 (its existence isn't revealed)
 * - member without the permission: 403
 *
 * This guards the module. Per-record rules (e.g. a coach may only edit groups
 * they staff) are still checked in the service layer.
 */
export function requireOrgPermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const access = req.access;
    if (!access) throw ApiError.unauthenticated();
    if (!access.membership) throw ApiError.notFound('Organisation');
    if (!hasOrgPermission(access.capabilities, access.membership.role, permission)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
