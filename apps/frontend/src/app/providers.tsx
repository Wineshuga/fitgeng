'use client';

import type { ReactNode } from 'react';
import { StoreProvider } from '@/store/StoreProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';

/** Client-side providers, mounted once in the root layout. Pages stay Server Components. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </StoreProvider>
  );
}
