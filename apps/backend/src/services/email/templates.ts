import { resolveBrand, resolveTheme } from '@fitgeng/shared';
import { env } from '../../config/env';

/**
 * Transactional email templates: content only, no business logic. Each returns
 * subject, HTML and plain text. Colours come from the shared theme file, so
 * emails match the product's branding.
 */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const brand = () => resolveBrand({ name: env.BRAND_NAME, supportEmail: env.BRAND_SUPPORT_EMAIL });

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout({ heading, intro, ctaLabel, ctaUrl, outro }: { heading: string; intro: string; ctaLabel: string; ctaUrl: string; outro: string }): string {
  const b = brand();
  const p = resolveTheme().palette;
  return `<!doctype html>
<html lang="en"><body style="margin:0;background:${p.neutral[50]};font-family:Arial,Helvetica,sans-serif;color:${p.neutral[900]}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" style="max-width:520px;background:${p.neutral[0]};border-radius:16px;padding:32px">
      <tr><td style="font-size:20px;font-weight:bold;color:${p.brand}">${escapeHtml(b.name)}</td></tr>
      <tr><td style="padding-top:24px;font-size:22px;font-weight:bold">${escapeHtml(heading)}</td></tr>
      <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:${p.neutral[600]}">${escapeHtml(intro)}</td></tr>
      <tr><td style="padding-top:24px"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${p.brand};color:${p.neutral[0]};text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">${escapeHtml(ctaLabel)}</a></td></tr>
      <tr><td style="padding-top:24px;font-size:13px;line-height:1.6;color:${p.neutral[500]}">${escapeHtml(outro)}<br><br>If the button doesn't work, paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(ctaUrl)}</span></td></tr>
    </table>
    <p style="font-size:12px;color:${p.neutral[500]}">Questions? ${escapeHtml(b.supportEmail)}</p>
  </td></tr></table>
</body></html>`;
}

export function verifyEmailTemplate(firstName: string, url: string): RenderedEmail {
  const b = brand();
  return {
    subject: `Verify your email for ${b.name}`,
    html: layout({
      heading: `Welcome, ${firstName}`,
      intro: `Confirm your email address to finish setting up your ${b.name} account.`,
      ctaLabel: 'Verify email',
      ctaUrl: url,
      outro: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
    }),
    text: `Welcome, ${firstName}.\n\nConfirm your email address to finish setting up your ${b.name} account:\n${url}\n\nThis link expires in 24 hours. If you didn't create an account, ignore this email.`,
  };
}

export function resetPasswordTemplate(firstName: string, url: string): RenderedEmail {
  const b = brand();
  return {
    subject: `Reset your ${b.name} password`,
    html: layout({
      heading: 'Reset your password',
      intro: `Hi ${firstName}, we received a request to reset your password.`,
      ctaLabel: 'Choose a new password',
      ctaUrl: url,
      outro: "This link expires in 1 hour and can be used once. If you didn't ask for this, ignore this email: your password won't change.",
    }),
    text: `Hi ${firstName},\n\nReset your ${b.name} password:\n${url}\n\nThis link expires in 1 hour. If you didn't ask for this, ignore this email.`,
  };
}

/** Sent when someone tries to register with an email that already has an account (prevents account enumeration). */
export function accountExistsTemplate(firstName: string, loginUrl: string, resetUrl: string): RenderedEmail {
  const b = brand();
  return {
    subject: `You already have a ${b.name} account`,
    html: layout({
      heading: 'You already have an account',
      intro: `Hi ${firstName}, someone (hopefully you) tried to create a new ${b.name} account with this email address. You can sign in instead.`,
      ctaLabel: 'Sign in',
      ctaUrl: loginUrl,
      outro: `Forgot your password? Reset it here: ${resetUrl}`,
    }),
    text: `Hi ${firstName},\n\nSomeone tried to create a new ${b.name} account with this email address. Sign in instead: ${loginUrl}\nForgot your password? ${resetUrl}`,
  };
}
