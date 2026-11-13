'use client';

import Link from 'next/link';

/**
 * DEVELOPMENT ONLY: shows the link from an email that wasn't really sent
 * (EMAIL_PROVIDER=log), so it can be clicked.
 *
 * The API includes `devLink` only outside production (devLinks.ts). As a second
 * guard, production builds of the frontend never render it.
 */
export function DevEmailLink({ href, label }: { href?: string; label: string }) {
  if (process.env.NODE_ENV === 'production' || !href) return null;

  // Same-site path, so it works whether the site was opened on localhost or 127.0.0.1.
  let path: string;
  try {
    const url = new URL(href);
    path = url.pathname + url.search;
  } catch {
    return null;
  }

  return (
    <div className="rounded-xl border border-dashed border-warning p-3 text-sm">
      <p className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">Development only</p>
      <p className="mt-1 text-fg-muted">Emails aren&apos;t sent in development. Here&apos;s the link from it:</p>
      <Link href={path} className="mt-2 inline-block font-semibold break-all text-brand-700 underline dark:text-brand-300">
        {label}
      </Link>
    </div>
  );
}
