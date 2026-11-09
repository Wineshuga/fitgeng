import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRoutes } from '@/test/renderWithProviders';
import { mockFetch } from '@/test/mockFetch';
import { routes } from '../routes';

const healthy = {
  data: { status: 'ok', uptimeSeconds: 1, version: '0.1.0', dependencies: { mongo: 'up', redis: 'up' } },
};

describe('app routes and layouts', () => {
  beforeEach(() => {
    mockFetch(() => ({ body: healthy }));
  });

  it('renders the landing page with live API status', async () => {
    renderRoutes(routes, '/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find your game');
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register');
    expect(await screen.findByText('All systems operational')).toBeInTheDocument();
  });

  it('shows the unavailable state when the API is down', async () => {
    mockFetch(() => ({ status: 503, body: { data: { ...healthy.data, status: 'down' } } }));
    renderRoutes(routes, '/');
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
  });

  it('renders the 404 page for unknown routes', () => {
    renderRoutes(routes, '/nowhere');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('renders the player layout with a mobile tab bar', () => {
    renderRoutes(routes, '/app/schedule');
    const tabs = screen.getByRole('navigation', { name: 'Player tabs' });
    expect(within(tabs).getAllByRole('link')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Schedule' })).toBeInTheDocument();
  });

  it('opens and closes the management drawer on mobile', async () => {
    renderRoutes(routes, '/manage');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });

    // Navigating from the drawer closes it.
    await userEvent.click(within(drawer).getByRole('link', { name: 'Players' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Players' })).toBeInTheDocument();
  });
});
