import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'No access', robots: { index: false } };

/** Rendered with HTTP 403 when a page calls forbidden(). */
export default function Forbidden() {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-brand-600">403</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">You don&apos;t have access to this</h1>
        <p className="mt-3 text-fg-muted">Ask an owner or admin of this organisation if you need it.</p>
        <Link href="/manage" className={`${buttonClasses('primary')} mt-6`}>
          Back to management
        </Link>
      </div>
    </div>
  );
}
