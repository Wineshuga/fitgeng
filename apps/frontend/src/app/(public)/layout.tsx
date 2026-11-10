import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonClasses } from '@/components/ui/Button';
import { ApiStatus } from '@/features/system/ApiStatus';
import { brand } from '@/config/brand';

/**
 * Public site shell (Server Component, rendered to HTML for search engines).
 * Only the theme toggle and the live API status indicator hydrate on the client.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/80 backdrop-blur dark:bg-canvas/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <BrandLogo />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <Link href="/sports" className={`${buttonClasses('ghost', 'sm')} hidden sm:inline-flex`}>
              Sports
            </Link>
            <ThemeToggle />
            <Link href="/login" className={buttonClasses('ghost', 'sm')}>
              Log in
            </Link>
            <Link href="/register" className={buttonClasses('primary', 'sm')}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 text-sm text-fg-subtle sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {brand.name}. Built for Nigeria&apos;s sports communities.
          </p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link href="/sports" className="hover:text-brand-600">
              Sports
            </Link>
            <Link href="/discover" className="hover:text-brand-600">
              Discover
            </Link>
          </nav>
          <ApiStatus />
        </div>
      </footer>
    </div>
  );
}
