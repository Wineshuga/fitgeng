import type { ReactElement, ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { makeStore, type AppStore } from '@/store/store';
import { StoreProvider } from '@/store/StoreProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

type ProvidersResult = RenderResult & { store: AppStore };

/**
 * Renders UI inside the same client providers the root layout uses. Passed as
 * RTL's `wrapper`, so `rerender` keeps the providers (and the same store).
 */
export function renderWithProviders(ui: ReactElement, { store = makeStore() }: { store?: AppStore } = {}): ProvidersResult {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <StoreProvider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </StoreProvider>
  );
  return Object.assign(render(ui, { wrapper: Wrapper }), { store });
}
