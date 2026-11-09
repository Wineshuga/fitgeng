'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** True when `href` is the current route (`exact`) or one of its ancestors. */
export function isActivePath(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavItemLinkProps {
  href: string;
  exact?: boolean;
  /** Plain strings, not a function, so Server Components can render this link. */
  className: string;
  activeClassName: string;
  inactiveClassName: string;
  children: ReactNode;
}

/** Next.js replacement for React Router's NavLink: adds active styling and aria-current. */
export function NavItemLink({ href, exact, className, activeClassName, inactiveClassName, children }: NavItemLinkProps) {
  const active = isActivePath(usePathname() ?? '', href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(className, active ? activeClassName : inactiveClassName)}
    >
      {children}
    </Link>
  );
}
