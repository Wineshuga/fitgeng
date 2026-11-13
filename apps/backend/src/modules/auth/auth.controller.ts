import type { CookieOptions, Request, Response } from 'express';
import { COOKIES, type AuthTokenResponse, type LoginInput, type RegisterInput } from '@fitgeng/shared';
import { isProd } from '../../config/env';
import { sendNoContent, sendSuccess } from '../../utils/response';
import { authService, type ClientInfo, type IssuedSession } from './auth.service';
import { User, toAuthUserDto } from '../users/user.model';
import { ApiError } from '../../utils/ApiError';
import { devLink } from './devLinks';

/** Refresh cookie (architecture D12): HttpOnly, SameSite=Lax, whole site, Secure in production. */
const cookieOptions = (expires?: Date): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  ...(expires ? { expires } : {}),
});

const client = (req: Request): ClientInfo => ({ userAgent: req.header('user-agent'), ip: req.ip });
const readRefreshCookie = (req: Request): string | undefined => req.cookies?.[COOKIES.refreshToken];

/** Sets the cookie and returns only what the browser may hold in memory. */
function respondWithSession(res: Response, issued: IssuedSession): void {
  res.cookie(COOKIES.refreshToken, issued.refreshToken, cookieOptions(issued.refreshExpiresAt));
  res.setHeader('Cache-Control', 'no-store');
  const body: AuthTokenResponse = { accessToken: issued.accessToken, expiresIn: issued.expiresIn, user: issued.user };
  sendSuccess(res, body);
}

/** 202 with a message, plus the emailed link in development only (see devLinks.ts). */
const accepted = (res: Response, message: string, emailedLink?: string) => {
  const link = devLink(emailedLink);
  sendSuccess(res, link ? { message, devLink: link } : { message }, 202);
};

export const authController = {
  async register(req: Request, res: Response) {
    const link = await authService.register(req.validated.body as RegisterInput);
    accepted(res, 'Check your email to verify your account.', link);
  },

  async verifyEmail(req: Request, res: Response) {
    await authService.verifyEmail((req.validated.body as { token: string }).token);
    sendSuccess(res, { message: 'Email verified. You can now sign in.' });
  },

  async resendVerification(req: Request, res: Response) {
    const link = await authService.resendVerification((req.validated.body as { email: string }).email);
    accepted(res, 'If that account needs verifying, we have sent a new link.', link);
  },

  async login(req: Request, res: Response) {
    respondWithSession(res, await authService.login(req.validated.body as LoginInput, client(req)));
  },

  async refresh(req: Request, res: Response) {
    try {
      respondWithSession(res, await authService.refresh(readRefreshCookie(req), client(req)));
    } catch (err) {
      // Drop a dead cookie so the browser stops presenting it.
      if (err instanceof ApiError && err.status === 401) res.clearCookie(COOKIES.refreshToken, cookieOptions());
      throw err;
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(readRefreshCookie(req));
    res.clearCookie(COOKIES.refreshToken, cookieOptions());
    sendNoContent(res);
  },

  async session(req: Request, res: Response) {
    const session = await authService.session(readRefreshCookie(req));
    res.setHeader('Cache-Control', 'no-store');
    sendSuccess(res, session);
  },

  async forgotPassword(req: Request, res: Response) {
    const link = await authService.forgotPassword((req.validated.body as { email: string }).email);
    accepted(res, 'If an account exists for that email, we have sent a reset link.', link);
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.validated.body as { token: string; password: string };
    await authService.resetPassword(token, password);
    res.clearCookie(COOKIES.refreshToken, cookieOptions());
    sendSuccess(res, { message: 'Password updated. Please sign in with your new password.' });
  },

  /** The current user (Bearer). */
  async me(req: Request, res: Response) {
    const user = await User.findById(req.access!.userId);
    if (!user) throw ApiError.unauthenticated();
    sendSuccess(res, toAuthUserDto(user));
  },
};
