import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const allowedOrigins = () => new Set([new URL(env.APP_URL).origin, ...env.CORS_ORIGINS.map((o) => new URL(o).origin)]);

/**
 * CSRF guard for the state-changing endpoints that read the refresh cookie
 * (refresh, logout). A cross-site form can't set custom headers, and a
 * cross-site fetch carrying one would need a CORS preflight that our allow-list
 * rejects. When an Origin header is present it must also be one of ours.
 * Bearer-authenticated endpoints don't need this, because browsers never attach
 * Bearer tokens automatically.
 */
export function requireCsrfHeader(req: Request, _res: Response, next: NextFunction): void {
  if (req.header('x-requested-with') !== 'fitgeng') throw ApiError.forbidden('Missing request header');
  const origin = req.header('origin');
  if (origin && !allowedOrigins().has(origin)) throw ApiError.forbidden('Origin not allowed');
  next();
}
