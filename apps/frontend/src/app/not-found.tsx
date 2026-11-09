import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-3 text-fg-muted">This page doesn&apos;t exist or has moved.</p>
        <Link href="/" className={`${buttonClasses('primary')} mt-6`}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
