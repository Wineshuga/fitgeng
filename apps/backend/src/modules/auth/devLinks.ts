import { env, isProd } from '../../config/env';

/**
 * Development convenience: when emails aren't really sent (EMAIL_PROVIDER `log`
 * or `memory`), auth responses also carry the link the email would contain, so
 * the frontend can show it.
 *
 * NEVER in production: a verification or reset link in an API response would
 * let anyone take over an account by its email address. Two independent guards:
 * production refuses to start without SendGrid (config/env.ts), and this
 * function checks production explicitly.
 */
export function shouldExposeDevLinks(options: { production: boolean; emailProvider: string }): boolean {
  return !options.production && options.emailProvider !== 'sendgrid';
}

/** The link to expose for this response, or undefined when exposure isn't allowed. */
export function devLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return shouldExposeDevLinks({ production: isProd, emailProvider: env.EMAIL_PROVIDER }) ? url : undefined;
}
