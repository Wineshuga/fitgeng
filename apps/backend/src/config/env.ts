import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Environment configuration, validated once at startup. A missing or invalid
 * variable stops the process with a clear message instead of failing later.
 *
 * Local dev reads the repo-root `.env`. In Docker the variables are injected
 * by Compose. Tests set their own values in tests/setup/env.ts.
 */
if (process.env.NODE_ENV !== 'test') {
  // src/config and dist/config are both four levels below the repo root.
  dotenv.config({ path: path.resolve(__dirname, '../../../../.env'), quiet: true });
}

const csv = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  APP_URL: z.url().default('http://localhost:3000'),
  CORS_ORIGINS: csv,
  /** Number of reverse proxies in front of the API (Nginx = 1). Used for client IPs. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  /** Empty string disables Redis; the app falls back to MongoDB / in-memory. */
  REDIS_URL: z.string().default(''),

  BRAND_NAME: z.string().optional(),
  BRAND_SUPPORT_EMAIL: z.string().optional(),

  // ---- Auth ----
  /** HS256 signing secret for access tokens. Generate with crypto.randomBytes(48). */
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  /** Requests per 15 minutes per IP on sensitive auth endpoints. */
  AUTH_RATE_LIMIT: z.coerce.number().int().min(1).default(20),

  // ---- Email ----
  /** "log" prints emails (dev), "memory" keeps them for tests, "sendgrid" sends them. */
  EMAIL_PROVIDER: z.enum(['log', 'memory', 'sendgrid']).default('log'),
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.email().default('no-reply@fitgeng.com'),
  EMAIL_FROM_NAME: z.string().default('FitGeng'),
}).superRefine((e, ctx) => {
  if (e.EMAIL_PROVIDER === 'sendgrid' && !e.SENDGRID_API_KEY) {
    ctx.addIssue({ code: 'custom', path: ['SENDGRID_API_KEY'], message: 'Required when EMAIL_PROVIDER=sendgrid' });
  }
  if (e.NODE_ENV === 'production' && e.EMAIL_PROVIDER !== 'sendgrid') {
    ctx.addIssue({ code: 'custom', path: ['EMAIL_PROVIDER'], message: 'Production must use sendgrid' });
  }
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
