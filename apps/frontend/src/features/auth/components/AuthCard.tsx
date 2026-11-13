import type { ReactNode } from 'react';

/** Frame for account pages: heading, optional subtitle, content and footer links. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line sm:p-8">
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-fg-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <div className="mt-6 border-t border-line pt-4 text-sm text-fg-muted">{footer}</div>}
    </section>
  );
}
