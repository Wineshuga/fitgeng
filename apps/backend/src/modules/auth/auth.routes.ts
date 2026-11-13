import { Router } from 'express';
import { emailOnlySchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from '@fitgeng/shared';
import { env } from '../../config/env';
import { validate } from '../../middleware/validate';
import { requireCsrfHeader } from '../../middleware/csrf';
import { createRateLimiter } from '../../middleware/rateLimit';
import { authenticate } from '../../middleware/authenticate';
import { authController as c } from './auth.controller';

/** Brute-force and abuse protection on credential and email-sending endpoints. */
const sensitive = createRateLimiter({ name: 'auth', windowMs: 15 * 60 * 1000, limit: env.AUTH_RATE_LIMIT });

export const authRouter = Router();

authRouter.post('/register', sensitive, validate({ body: registerSchema }), c.register);
authRouter.post('/login', sensitive, validate({ body: loginSchema }), c.login);
authRouter.post('/verify-email', sensitive, validate({ body: verifyEmailSchema }), c.verifyEmail);
authRouter.post('/resend-verification', sensitive, validate({ body: emailOnlySchema }), c.resendVerification);
authRouter.post('/forgot-password', sensitive, validate({ body: emailOnlySchema }), c.forgotPassword);
authRouter.post('/reset-password', sensitive, validate({ body: resetPasswordSchema }), c.resetPassword);

// Cookie-based endpoints. State-changing ones require the CSRF header.
authRouter.post('/refresh', requireCsrfHeader, c.refresh);
authRouter.post('/logout', requireCsrfHeader, c.logout);
authRouter.get('/session', c.session);

export const meRouter = Router();
meRouter.get('/', authenticate, c.me);
