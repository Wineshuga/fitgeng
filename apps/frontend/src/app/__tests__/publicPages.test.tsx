import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockFetch } from '@/test/mockFetch';
import PublicLayout from '../(public)/layout';
import LandingPage from '../(public)/page';
import NotFound from '../not-found';

const healthy = {
  data: { status: 'ok', uptimeSeconds: 1, version: '0.1.0', dependencies: { mongo: 'up', redis: 'up' } },
};

const renderLanding = () =>
  renderWithProviders(
    <PublicLayout>
      <LandingPage />
    </PublicLayout>,
  );

describe('public pages', () => {
  beforeEach(() => {
    mockFetch(() => ({ body: healthy }));
  });

  it('renders the landing page with live API status', async () => {
    renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find your game');
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /explore groups/i })).toHaveAttribute('href', '/discover');
    expect(await screen.findByText('All systems operational')).toBeInTheDocument();
  });

  it('shows the unavailable state when the API is down', async () => {
    mockFetch(() => ({ status: 503, body: { data: { ...healthy.data, status: 'down' } } }));
    renderLanding();
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
  });

  it('renders the 404 page', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});
