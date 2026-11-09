'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './store';
import { ACTIVE_ORG_KEY, setActiveOrg } from './uiSlice';

/**
 * One Redux store per provider instance (so per request on the server, and one
 * per tab in the browser). Persisted UI values are restored after mount, which
 * keeps the first client render identical to the server render.
 */
export function StoreProvider({ children, store: injected }: { children: ReactNode; store?: AppStore }) {
  const [store] = useState(() => injected ?? makeStore());

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ORG_KEY);
      if (saved) store.dispatch(setActiveOrg(saved));
    } catch {
      /* storage unavailable */
    }

    let last = store.getState().ui.activeOrgId;
    return store.subscribe(() => {
      const next = store.getState().ui.activeOrgId;
      if (next === last) return;
      last = next;
      try {
        if (next) localStorage.setItem(ACTIVE_ORG_KEY, next);
        else localStorage.removeItem(ACTIVE_ORG_KEY);
      } catch {
        /* storage unavailable */
      }
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
