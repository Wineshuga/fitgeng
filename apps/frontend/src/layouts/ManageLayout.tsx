'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Capability } from '@fitgeng/shared';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/Icon';
import { NavItemLink } from '@/components/NavItemLink';
import { filterNav, manageNav } from '@/routes/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { setMobileNavOpen } from '@/store/uiSlice';

interface ManageLayoutProps {
  children: ReactNode;
  /** From the server-side session from Phase 2. Until then the full menu is shown. */
  capabilities?: readonly Capability[];
}

/**
 * Coach and organiser dashboard shell: sidebar on desktop, slide-over drawer on
 * mobile. A Client Component because the drawer has state and closes on navigation.
 */
export function ManageLayout({ children, capabilities = ['coach', 'organiser'] }: ManageLayoutProps) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const pathname = usePathname();
  const items = filterNav(manageNav, capabilities);

  // Close the drawer after navigating.
  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  const nav = (
    <nav aria-label="Management" className="flex flex-col gap-1 p-3">
      {items.map((item) => (
        <NavItemLink
          key={item.to}
          href={item.to}
          exact={item.to === '/manage'}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          activeClassName="bg-brand-600 text-on-brand shadow-sm"
          inactiveClassName="text-fg-muted hover:bg-surface-muted"
        >
          <Icon name={item.icon} />
          {item.label}
        </NavItemLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center px-5">
          <BrandLogo href="/manage" />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-overlay"
            aria-label="Close navigation"
            onClick={() => dispatch(setMobileNavOpen(false))}
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface shadow-xl">
            <div className="flex h-16 items-center justify-between px-5">
              <BrandLogo href="/manage" />
              <button
                type="button"
                aria-label="Close navigation"
                className="grid size-10 place-items-center rounded-xl hover:bg-surface-muted"
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-surface/85 px-4 backdrop-blur">
          <button
            type="button"
            aria-label="Open navigation"
            className="grid size-10 place-items-center rounded-xl hover:bg-surface-muted md:hidden"
            onClick={() => dispatch(setMobileNavOpen(true))}
          >
            <Icon name="menu" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
