import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ERROR_CODES, type Capability } from '@fitgeng/shared';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../modules/auth/tokens';
import { User } from '../modules/users/user.model';

/**
 * Verifies the Bearer access token and sets `req.access` (used by
 * requireOrgPermission and services).
 *
 * The user is re-read on every request, so suspension, capability changes and
 * "sign out everywhere" (tokenVersion) take effect immediately rather than when
 * the token expires. It's one indexed read; it can move to a short Redis cache
 * if profiling ever calls for it.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) throw ApiError.unauthenticated();

  let claims;
  try {
    claims = verifyAccessToken(header.slice(7));
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, 'Access token expired');
    }
    throw ApiError.unauthenticated('Invalid access token');
  }

  const user = await User.findById(claims.sub).select('capabilities isPlatformAdmin status tokenVersion emailVerifiedAt').lean();
  if (!user || user.tokenVersion !== claims.tv || user.status !== 'active' || !user.emailVerifiedAt) {
    throw ApiError.unauthenticated('Session is no longer valid');
  }

  req.access = {
    userId: String(user._id),
    capabilities: user.capabilities as Capability[],
    isPlatformAdmin: user.isPlatformAdmin,
  };
  next();
}

/** Platform-admin-only routes (capability approvals, sports catalogue). Use after `authenticate`. */
export function requirePlatformAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.access) throw ApiError.unauthenticated();
  if (!req.access.isPlatformAdmin) throw ApiError.forbidden();
  next();
}
