import sgMail from '@sendgrid/mail';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { RenderedEmail } from './templates';

/**
 * Transactional email. The provider is chosen by EMAIL_PROVIDER:
 *   log      - dev: prints subject and links to the console (no SendGrid key needed)
 *   memory   - tests: keeps messages in `outbox` for assertions
 *   sendgrid - production
 * The SendGrid key stays inside this module and is never logged.
 */
export interface OutgoingEmail extends RenderedEmail {
  to: string;
}

interface EmailProvider {
  send(message: OutgoingEmail): Promise<void>;
}

/** Messages captured by the memory provider (tests only). */
export const outbox: OutgoingEmail[] = [];

const providers: Record<typeof env.EMAIL_PROVIDER, () => EmailProvider> = {
  log: () => ({
    async send(m) {
      const links = m.text.match(/https?:\/\/\S+/g) ?? [];
      logger.info({ to: m.to, subject: m.subject, links }, 'Email (log provider, not sent)');
    },
  }),
  memory: () => ({
    async send(m) {
      outbox.push(m);
    },
  }),
  sendgrid: () => {
    sgMail.setApiKey(env.SENDGRID_API_KEY!);
    return {
      async send(m) {
        await sgMail.send({
          to: m.to,
          from: { email: env.EMAIL_FROM_ADDRESS, name: env.EMAIL_FROM_NAME },
          subject: m.subject,
          html: m.html,
          text: m.text,
        });
      },
    };
  },
};

let provider: EmailProvider | null = null;
const getProvider = () => (provider ??= providers[env.EMAIL_PROVIDER]());

/**
 * Sends without blocking or failing the caller's business operation. Failures
 * are logged, and users can always request the email again (resend
 * verification, forgot password).
 */
export function sendEmail(message: OutgoingEmail): Promise<void> {
  return getProvider()
    .send(message)
    .catch((err: unknown) => {
      logger.error({ err: (err as Error)?.message, subject: message.subject }, 'Email delivery failed');
    });
}
