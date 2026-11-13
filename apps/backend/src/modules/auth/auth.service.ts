import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import mongoose, { type Types } from 'mongoose';
import {
  ERROR_CODES,
  type AuthTokenResponse,
  type LoginInput,
  type RegisterInput,
  type Session,
} from '@fitgeng/shared';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { sendEmail } from '../../services/email';
import { accountExistsTemplate, resetPasswordTemplate, verifyEmailTemplate } from '../../services/email/templates';
import { PlayerProfile } from '../users/playerProfile.model';
import { User, toAuthUserDto, type UserDoc } from '../users/user.model';
import { EmailToken, RefreshToken, type EmailTokenPurpose } from './token.models';
import { hashToken, randomToken, signAccessToken } from './tokens';

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
/** A refresh token rotated this recently may be presented again by a concurrent request (e.g. two tabs) without counting as reuse. */
const ROTATION_GRACE_MS = 10_000;

/**
 * sanitizeFilter is on (database.ts), so $-operators in filters are neutralised
 * unless the operator object itself is marked trusted. Only server-built
 * values go through this helper, never user input.
 */
const notExpired = () => mongoose.trusted({ $gt: new Date() }) as unknown as Date;

export interface ClientInfo {
  userAgent?: string;
  ip?: string;
}

export interface IssuedSession extends AuthTokenResponse {
  refreshToken: string;
  refreshExpiresAt: Date;
  /** Internal: id of the stored refresh-token document (links rotations). */
  refreshTokenId: unknown;
}

/** Compares against a real hash when the user doesn't exist, so response timing doesn't reveal registered emails. */
let dummyHashPromise: Promise<string> | null = null;
const dummyHash = () => (dummyHashPromise ??= argon2.hash(randomToken(), { type: argon2.argon2id }));

const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });

function appUrl(path: string): string {
  return new URL(path, `${env.APP_URL.replace(/\/$/, '')}/`).toString();
}

async function createEmailToken(userId: Types.ObjectId, purpose: EmailTokenPurpose, ttlMs: number): Promise<string> {
  // Only the newest link of each kind works.
  await EmailToken.updateMany({ userId, purpose, usedAt: null }, { usedAt: new Date() });
  const token = randomToken();
  await EmailToken.create({ userId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}

/** Atomically consumes a valid email token, or throws. */
async function consumeEmailToken(token: string, purpose: EmailTokenPurpose) {
  const doc = await EmailToken.findOneAndUpdate(
    { tokenHash: hashToken(token), purpose, usedAt: null, expiresAt: notExpired() },
    { usedAt: new Date() },
    { returnDocument: 'after' },
  );
  if (!doc) throw ApiError.badRequest('This link is invalid or has expired. Request a new one.');
  return doc;
}

async function sendVerification(user: Pick<UserDoc, '_id' | 'email' | 'firstName'>) {
  const token = await createEmailToken(user._id, 'verify_email', VERIFY_TTL_MS);
  const url = appUrl(`/verify-email?token=${token}`);
  void sendEmail({ to: user.email, ...verifyEmailTemplate(user.firstName, url) });
}

function assertCanSignIn(user: Pick<UserDoc, 'status' | 'emailVerifiedAt'>) {
  if (user.status !== 'active') {
    throw new ApiError(403, ERROR_CODES.ACCOUNT_SUSPENDED, 'This account is suspended. Contact support.');
  }
  if (!user.emailVerifiedAt) {
    throw new ApiError(403, ERROR_CODES.EMAIL_NOT_VERIFIED, 'Verify your email address before signing in.');
  }
}

async function issueSession(user: UserDoc, client: ClientInfo, familyId: string = randomUUID()): Promise<IssuedSession> {
  const refreshToken = randomToken(48);
  const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const stored = await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    familyId,
    expiresAt: refreshExpiresAt,
    userAgent: client.userAgent?.slice(0, 300),
    ip: client.ip,
  });
  const accessToken = signAccessToken({ sub: String(user._id), tv: user.tokenVersion, caps: [...user.capabilities] as never });
  return {
    accessToken,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    user: toAuthUserDto(user),
    refreshToken,
    refreshExpiresAt,
    refreshTokenId: stored._id,
  };
}

export const authService = {
  /**
   * Creates the account and emails a verification link. Never reveals whether
   * the email was already registered: existing users get a "you already have
   * an account" email instead, and the response is identical either way.
   */
  async register(input: RegisterInput): Promise<void> {
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      if (existing.emailVerifiedAt) {
        void sendEmail({
          to: existing.email,
          ...accountExistsTemplate(existing.firstName, appUrl('/login'), appUrl('/forgot-password')),
        });
      } else {
        await sendVerification(existing);
      }
      return;
    }

    const passwordHash = await hashPassword(input.password);
    let user: UserDoc | undefined;
    try {
      await mongoose.connection.transaction(async (session) => {
        [user] = await User.create(
          [{ email: input.email, passwordHash, firstName: input.firstName, lastName: input.lastName, capabilities: ['player'] }],
          { session },
        );
        await PlayerProfile.create([{ userId: user!._id }], { session });
      });
    } catch (err) {
      // Two simultaneous registrations for the same email: the unique index wins; respond identically.
      if ((err as { code?: number }).code === 11000) return;
      throw err;
    }
    await sendVerification(user!);
  },

  async verifyEmail(token: string): Promise<void> {
    const doc = await consumeEmailToken(token, 'verify_email');
    await User.updateOne({ _id: doc.userId, emailVerifiedAt: null }, { emailVerifiedAt: new Date() });
  },

  /** Always succeeds from the caller's point of view (no account enumeration). */
  async resendVerification(email: string): Promise<void> {
    const user = await User.findOne({ email, emailVerifiedAt: null, status: 'active' });
    if (user) await sendVerification(user);
  },

  async login(input: LoginInput, client: ClientInfo): Promise<IssuedSession> {
    const user = await User.findOne({ email: input.email }).select('+passwordHash');
    const ok = await argon2.verify(user?.passwordHash ?? (await dummyHash()), input.password).catch(() => false);
    if (!user || !ok) throw ApiError.unauthenticated('Incorrect email or password');
    assertCanSignIn(user);

    user.lastLoginAt = new Date();
    await user.save();
    return issueSession(user, client);
  },

  /**
   * Rotates a refresh token: the presented token is revoked and a new one is
   * issued in the same family. Presenting an already-revoked token outside the
   * grace window means it leaked, so the whole family (that sign-in on that
   * device) is revoked.
   */
  async refresh(rawToken: string | undefined, client: ClientInfo): Promise<IssuedSession> {
    if (!rawToken) throw ApiError.unauthenticated('Session expired. Please sign in again.');
    const token = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
    if (!token) throw ApiError.unauthenticated('Session expired. Please sign in again.');

    if (token.revokedAt) {
      const recentlyRotated = token.replacedBy && Date.now() - token.revokedAt.getTime() < ROTATION_GRACE_MS;
      if (!recentlyRotated) {
        await RefreshToken.updateMany({ familyId: token.familyId, revokedAt: null }, { revokedAt: new Date() });
      }
      throw ApiError.unauthenticated('Session expired. Please sign in again.');
    }
    if (token.expiresAt.getTime() <= Date.now()) throw ApiError.unauthenticated('Session expired. Please sign in again.');

    const user = await User.findById(token.userId);
    if (!user || user.status !== 'active' || !user.emailVerifiedAt) {
      throw ApiError.unauthenticated('Session expired. Please sign in again.');
    }

    // Claim the token atomically so two concurrent refreshes can't both rotate it.
    const claimed = await RefreshToken.findOneAndUpdate(
      { _id: token._id, revokedAt: null },
      { revokedAt: new Date() },
      { returnDocument: 'after' },
    );
    if (!claimed) throw ApiError.unauthenticated('Session expired. Please sign in again.');

    const next = await issueSession(user, client, token.familyId);
    await RefreshToken.updateOne({ _id: token._id }, { replacedBy: next.refreshTokenId });
    return next;
  },

  /** Ends this sign-in (the token's whole family). Idempotent. */
  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    const token = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
    if (token) await RefreshToken.updateMany({ familyId: token.familyId, revokedAt: null }, { revokedAt: new Date() });
  },

  /**
   * Read-only session check for server-rendered pages: validates the refresh
   * token without rotating it and returns no tokens.
   */
  async session(rawToken: string | undefined): Promise<Session> {
    if (!rawToken) throw ApiError.unauthenticated();
    const token = await RefreshToken.findOne(
      { tokenHash: hashToken(rawToken), revokedAt: null, expiresAt: notExpired() },
    );
    if (!token) throw ApiError.unauthenticated();
    const user = await User.findById(token.userId);
    if (!user || user.status !== 'active' || !user.emailVerifiedAt) throw ApiError.unauthenticated();

    const { emailVerified: _ignored, ...sessionUser } = toAuthUserDto(user);
    return {
      user: sessionUser,
      // Organisation memberships arrive with organisations (Phase 3a).
      memberships: [],
    };
  },

  /** Always succeeds from the caller's point of view (no account enumeration). */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email, status: 'active' });
    if (!user) return;
    const token = await createEmailToken(user._id, 'reset_password', RESET_TTL_MS);
    void sendEmail({ to: user.email, ...resetPasswordTemplate(user.firstName, appUrl(`/reset-password?token=${token}`)) });
  },

  /**
   * Sets a new password and signs the user out everywhere: every refresh token
   * is revoked and tokenVersion increments, which invalidates outstanding access
   * tokens. Completing a reset also proves ownership of the email address.
   */
  async resetPassword(token: string, password: string): Promise<void> {
    const passwordHash = await hashPassword(password);
    await mongoose.connection.transaction(async (session) => {
      const doc = await EmailToken.findOneAndUpdate(
        { tokenHash: hashToken(token), purpose: 'reset_password', usedAt: null, expiresAt: notExpired() },
        { usedAt: new Date() },
        { returnDocument: 'after', session },
      );
      if (!doc) throw ApiError.badRequest('This link is invalid or has expired. Request a new one.');

      const now = new Date();
      await User.updateOne({ _id: doc.userId }, { $set: { passwordHash }, $inc: { tokenVersion: 1 } }, { session });
      // The reset link proves the user controls the address; verify it if it wasn't already.
      await User.updateOne({ _id: doc.userId, emailVerifiedAt: null }, { emailVerifiedAt: now }, { session });
      await RefreshToken.updateMany({ userId: doc.userId, revokedAt: null }, { revokedAt: now }, { session });
    });
  },
};
