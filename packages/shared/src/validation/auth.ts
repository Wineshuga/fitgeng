import { z } from 'zod';

/**
 * Auth request schemas, shared by the API (validation) and the frontend forms
 * (Phase 2b), so both enforce exactly the same rules.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address').max(254));

/** Length-based policy (NIST 800-63B): long passphrases beat composition rules. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters`);

const nameSchema = z.string().trim().min(1, 'Required').max(60);

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema,
    // No length rules on login: never reveal the policy for existing accounts.
    password: z.string().min(1, 'Required').max(PASSWORD_MAX),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

/** Tokens from email links: URL-safe random strings. */
export const emailTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/, 'Invalid or expired link');

export const verifyEmailSchema = z.object({ token: emailTokenSchema }).strict();
export const emailOnlySchema = z.object({ email: emailSchema }).strict();
export const resetPasswordSchema = z.object({ token: emailTokenSchema, password: passwordSchema }).strict();

/** Public view of the signed-in user, returned by login, refresh and session. */
export interface AuthUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  capabilities: ('player' | 'coach' | 'organiser')[];
  isPlatformAdmin: boolean;
  emailVerified: boolean;
}

export interface AuthTokenResponse {
  /** Short-lived Bearer token. Keep it in memory only, never in storage. */
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: AuthUserDto;
}
