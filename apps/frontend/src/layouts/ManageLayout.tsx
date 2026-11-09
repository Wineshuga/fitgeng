import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import type { Capability } from '@fitgeng/shared';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/Icon';
import { filterNav, manageNav } from '@/routes/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { setMobileNavOpen } from '@/store/uiSlice';
import { cn } from '@/utils/cn';

interface ManageLayoutProps {
  /** Comes from the auth state from Phase 2. Until then the full menu is shown. */
  capabilities?: readonly Capability[];
}

/** Coach and organiser dashboard shell: sidebar on desktop, slide-over drawer on mobile. */
export function ManageLayout({ capabilities = ['coach', 'organiser'] }: ManageLayoutProps) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const location = useLocation();
  const items = filterNav(manageNav, capabilities);

  // Close the drawer after navigating.
  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [location.pathname, dispatch]);

  const nav = (
    <nav aria-label="Management" className="flex flex-col gap-1 p-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/manage'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            )
          }
        >
          <Icon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center px-5">
          <BrandLogo to="/manage" />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label="Close navigation"
            onClick={() => dispatch(setMobileNavOpen(false))}
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between px-5">
              <BrandLogo to="/manage" />
              <button
                type="button"
                aria-label="Close navigation"
                className="grid size-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => dispatch(setMobileNavOpen(false))}
              >
                <Icon name="close" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
          <button
            type="button"
            aria-label="Open navigation"
            className="grid size-10 place-items-center rounded-xl hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
            onClick={() => dispatch(setMobileNavOpen(true))}
          >
            <Icon name="menu" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
