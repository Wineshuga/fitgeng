'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { COOKIES, type Capability, type SessionMembership } from '@fitgeng/shared';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/Icon';
import { NavItemLink } from '@/components/NavItemLink';
import { useAppDispatch, useAppSelector } from '@/hooks/store';
import { setMobileNavOpen } from '@/store/uiSlice';
import { buildNavSections } from '../modules';
import { OrgSwitcher } from './OrgSwitcher';

export interface ManageShellProps {
  children: ReactNode;
  /** Current organisation (from the URL), already verified on the server. */
  org: SessionMembership;
  /** All organisations the user can manage, for the switcher. */
  memberships: SessionMembership[];
  capabilities: Capability[];
  /** Module keys the server allowed for this org (permissions resolved server-side). */
  allowedModules: string[];
  userName: string;
}

const linkBase = 'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors';
const linkActive = 'bg-brand-600 text-on-brand shadow-sm';
const linkInactive = 'text-fg-muted hover:bg-surface-muted';

/**
 * The one management shell, shared by coaches, organisers and anyone holding
 * both capabilities. Its contents depend only on permissions. Sidebar on
 * desktop, slide-over drawer on mobile.
 */
export function ManageShell({ children, org, memberships, capabilities, allowedModules, userName }: ManageShellProps) {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const pathname = usePathname();
  const base = `/manage/${org.slug}`;
  const sections = buildNavSections(allowedModules);

  // Close the drawer after navigating.
  useEffect(() => {
    dispatch(setMobileNavOpen(false));
  }, [pathname, dispatch]);

  // Remember the last organisation so /manage reopens it (non-sensitive slug, readable by the server).
  useEffect(() => {
    document.cookie = `${COOKIES.lastOrg}=${encodeURIComponent(org.slug)}; Path=/manage; Max-Age=31536000; SameSite=Lax`;
  }, [org.slug]);

  const nav = (
    <nav aria-label="Management" className="flex flex-col gap-5 p-3">
      <div className="flex flex-col gap-1">
        <NavItemLink href={base} exact className={linkBase} activeClassName={linkActive} inactiveClassName={linkInactive}>
          <Icon name="grid" />
          Overview
        </NavItemLink>
      </div>
      {sections.map((s) => (
        <div key={s.section} role="group" aria-labelledby={`nav-${s.section}`} className="flex flex-col gap-1">
          <p id={`nav-${s.section}`} className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-fg-subtle uppercase">
            {s.label}
          </p>
          {s.modules.map((m) => (
            <NavItemLink
              key={m.key}
              href={`${base}/${m.key}`}
              className={linkBase}
              activeClassName={linkActive}
              inactiveClassName={linkInactive}
            >
              <Icon name={m.icon} />
              {m.label}
            </NavItemLink>
          ))}
        </div>
      ))}
    </nav>
  );

  const switcher = <OrgSwitcher current={org} memberships={memberships} capabilities={capabilities} />;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center px-5">
          <BrandLogo href="/manage" />
        </div>
        <div className="px-3 pb-2">{switcher}</div>
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
            <div className="px-3 pb-2">{switcher}</div>
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
          <p className="truncate text-sm font-semibold md:hidden">{org.name}</p>
          <div className="flex-1" />
          <span className="hidden text-sm text-fg-muted sm:inline">{userName}</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
