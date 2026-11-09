import { Link, Outlet } from 'react-router';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { buttonClasses } from '@/components/ui/Button';
import { ApiStatus } from '@/features/system/ApiStatus';
import { brand } from '@/config/brand';

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <BrandLogo />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
            <ThemeToggle />
            <Link to="/login" className={buttonClasses('ghost', 'sm')}>
              Log in
            </Link>
            <Link to="/register" className={buttonClasses('primary', 'sm')}>
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {brand.name}. Built for Nigeria's sports communities.
          </p>
          <ApiStatus />
        </div>
      </footer>
    </div>
  );
}
