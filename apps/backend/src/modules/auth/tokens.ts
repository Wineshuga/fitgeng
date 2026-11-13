import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Capability } from '@fitgeng/shared';
import { env } from '../../config/env';

const ISSUER = 'fitgeng-api';
const AUDIENCE = 'fitgeng';

/** URL-safe random token (refresh tokens, email links). 32 bytes = 256 bits. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Tokens are high-entropy random values, so a fast hash is appropriate (no salt or KDF needed). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface AccessClaims {
  sub: string;
  /** User.tokenVersion at issue time; a mismatch means the token was revoked. */
  tv: number;
  caps: Capability[];
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

/** Throws jsonwebtoken errors (TokenExpiredError, JsonWebTokenError) on invalid tokens. */
export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.tv !== 'number') {
    throw new jwt.JsonWebTokenError('Malformed token');
  }
  return payload as unknown as AccessClaims;
}
