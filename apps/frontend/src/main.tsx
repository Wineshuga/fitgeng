import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { makeStore } from '@/app/store';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { applyBrandTheme } from '@/config/brand';
import { routes } from '@/routes/routes';
import './index.css';

applyBrandTheme();

const store = makeStore();
const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
);
