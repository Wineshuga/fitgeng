'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { THEME_STORAGE_KEY } from './themeScript';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  /** False during server render and the first client render (before storage is read). */
  hydrated: boolean;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Theme is a UI preference scoped to this browser, which is why it lives in
 * Context rather than Redux.
 *
 * Hydration safety: the server can't know the stored preference, so the first
 * render always uses 'system'. Browser state is read only after mount, and the
 * <html> class isn't touched until then. themeInitScript has already set the
 * correct class before paint.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    // Reading browser-only state after mount is the intended pattern here.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPreferenceState(readStored());
    setSystemDark(mq?.matches ?? false);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    if (hydrated) document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved, hydrated]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      /* storage unavailable: preference lasts for this session only */
    }
  }, []);

  const toggle = useCallback(() => setPreference(resolved === 'dark' ? 'light' : 'dark'), [resolved, setPreference]);

  const value = useMemo(
    () => ({ preference, resolved, hydrated, setPreference, toggle }),
    [preference, resolved, hydrated, setPreference, toggle],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
