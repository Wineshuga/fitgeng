import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/Icon';
import { NavItemLink } from '@/components/NavItemLink';
import { LogoutButton } from '@/features/auth/components/SessionControls';
import { playerNav } from '@/routes/navigation';

/**
 * Player app shell (Server Component): top navigation on desktop, bottom tab
 * bar on mobile, since most players use the app on their phones. Only the links
 * (active state) and the theme toggle run on the client.
 */
export function PlayerLayout({ children }: { children: ReactNode }) {
  const tabs = playerNav.slice(0, 5);

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <BrandLogo href="/player" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Player">
            {playerNav.map((item) => (
              <NavItemLink
                key={item.to}
                href={item.to}
                exact={item.to === '/player'}
                className="rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                activeClassName="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                inactiveClassName="text-fg-muted hover:bg-surface-muted"
              >
                {item.label}
              </NavItemLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>

      <nav
        aria-label="Player tabs"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {tabs.map((item) => (
            <li key={item.to}>
              <NavItemLink
                href={item.to}
                exact={item.to === '/player'}
                className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium"
                activeClassName="text-brand-600 dark:text-brand-400"
                inactiveClassName="text-fg-subtle"
              >
                <Icon name={item.icon} />
                {item.label}
              </NavItemLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
