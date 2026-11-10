import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { healthy, mockApi, testSports } from '@/test/mockApi';
import PublicLayout from '../(public)/layout';
import LandingPage, { metadata as landingMetadata } from '../(public)/page';
import NotFound from '../not-found';

async function renderLanding() {
  const page = await LandingPage();
  return renderWithProviders(<PublicLayout>{page}</PublicLayout>);
}

const jsonLdTypes = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
    const data = JSON.parse(s.textContent ?? '[]');
    return (Array.isArray(data) ? data : [data]).map((d: { '@type': string }) => d['@type']);
  });

describe('landing page', () => {
  it('renders hero content and live API status', async () => {
    mockApi({ '/health': { body: healthy }, '/sports': { body: { data: testSports } } });
    await renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find your game');
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /explore groups/i })).toHaveAttribute('href', '/discover');
    expect(await screen.findByText('All systems operational')).toBeInTheDocument();
  });

  it('links to each sport page from the API (internal links for crawlers)', async () => {
    mockApi({ '/health': { body: healthy }, '/sports': { body: { data: testSports } } });
    await renderLanding();
    const list = screen.getByRole('list', { name: 'Supported sports' });
    expect(list).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lawn tennis' })).toHaveAttribute('href', '/sports/tennis');
    expect(screen.getByRole('link', { name: 'All sports' })).toHaveAttribute('href', '/sports');
  });

  it('includes WebSite and Organization structured data', async () => {
    mockApi({ '/health': { body: healthy }, '/sports': { body: { data: testSports } } });
    const { container } = await renderLanding();
    expect(jsonLdTypes(container)).toEqual(expect.arrayContaining(['WebSite', 'Organization']));
  });

  it('still renders when the API is down (sports list omitted)', async () => {
    mockApi({ '/health': { status: 503, body: { data: { ...healthy.data, status: 'down' } } }, '/sports': { status: 500, body: {} } });
    await renderLanding();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Supported sports' })).not.toBeInTheDocument();
    expect(await screen.findByText('Service unavailable')).toBeInTheDocument();
  });

  it('has a canonical URL and an absolute brand title', () => {
    expect(landingMetadata.alternates?.canonical).toBe('/');
    expect(landingMetadata.title).toEqual({ absolute: expect.stringContaining('FitGeng') });
  });
});

describe('404 page', () => {
  it('renders', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});
