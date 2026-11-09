'use client';

import { useTheme } from '@/contexts/ThemeContext';

/**
 * The icon is chosen with CSS from the <html> class (set before paint), so the
 * server render and the first client render are identical, with no icon flash.
 * aria-pressed is added only after hydration, once the real state is known.
 */
export function ThemeToggle() {
  const { resolved, hydrated, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      aria-pressed={hydrated ? resolved === 'dark' : undefined}
      className="grid size-10 place-items-center rounded-xl text-fg-muted hover:bg-surface-muted"
    >
      <svg viewBox="0 0 24 24" className="hidden size-5 dark:block" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
      </svg>
      <svg viewBox="0 0 24 24" className="size-5 dark:hidden" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}
