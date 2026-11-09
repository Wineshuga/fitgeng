import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { makeStore, type AppStore } from '@/app/store';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface Options {
  store?: AppStore;
}

type ProvidersResult = RenderResult & { store: AppStore };

/** Renders a component inside the same providers the app uses. */
export function renderWithProviders(ui: ReactElement, { store = makeStore() }: Options = {}): ProvidersResult {
  const result = render(
    <Provider store={store}>
      <ThemeProvider>{ui}</ThemeProvider>
    </Provider>,
  );
  return Object.assign(result, { store });
}

/** Renders a route tree at `path` using an in-memory router. */
export function renderRoutes(
  routes: RouteObject[],
  path = '/',
  options: Options = {},
): ProvidersResult & { router: ReturnType<typeof createMemoryRouter> } {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return Object.assign(renderWithProviders(<RouterProvider router={router} />, options), { router });
}
