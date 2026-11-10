import { render, screen, within } from '@testing-library/react';
import { mockApi, sport, testSports } from '@/test/mockApi';
import { navigationMock } from '@/test/serverMocks';
import SportsPage, { metadata as sportsMetadata } from '../(public)/sports/page';
import SportPage, { generateMetadata, generateStaticParams } from '../(public)/sports/[slug]/page';

jest.mock('next/navigation', () => jest.requireActual('@/test/serverMocks').navigationMock);

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const tennis = testSports[0]!;

function jsonLd(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
    const data = JSON.parse(s.textContent ?? '[]');
    return Array.isArray(data) ? data : [data];
  });
}

describe('/sports', () => {
  it('lists sports with links to their pages', async () => {
    mockApi({ '/sports': { body: { data: testSports } } });
    render(await SportsPage());
    expect(screen.getByRole('heading', { level: 1, name: 'Sports' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lawn tennis/ })).toHaveAttribute('href', '/sports/tennis');
    expect(screen.getByRole('link', { name: /Football/ })).toHaveAttribute('href', '/sports/football');
  });

  it('shows an empty state', async () => {
    mockApi({ '/sports': { body: { data: [] } } });
    render(await SportsPage());
    expect(screen.getByText('No sports are listed yet.')).toBeInTheDocument();
  });

  it('degrades gracefully when the API fails', async () => {
    mockApi({ '/sports': { status: 500, body: {} } });
    render(await SportsPage());
    expect(screen.getByRole('status')).toHaveTextContent(/temporarily unavailable/);
  });

  it('has its own canonical metadata', () => {
    expect(sportsMetadata.alternates?.canonical).toBe('/sports');
    expect(sportsMetadata.title).toBe('Sports');
  });
});

describe('/sports/[slug]', () => {
  it('prebuilds nothing, so builds never need the API (pages render on first request)', () => {
    expect(generateStaticParams()).toEqual([]);
  });

  it('server-renders the sport from the API with breadcrumbs and related links', async () => {
    mockApi({ '/sports/tennis': { body: { data: tennis } }, '/sports': { body: { data: testSports } } });
    render(await SportPage(params('tennis')));

    expect(screen.getByRole('heading', { level: 1, name: 'Lawn tennis' })).toBeInTheDocument();
    expect(screen.getByText(tennis.description)).toBeInTheDocument();
    expect(screen.getByText('Individual sport')).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Sports' })).toHaveAttribute('href', '/sports');
    expect(screen.getByRole('link', { name: 'Find lawn tennis groups' })).toHaveAttribute('href', '/discover?sport=tennis');
    // Related sports exclude the current one.
    const others = screen.getByRole('region', { name: 'Other sports' });
    expect(within(others).getByRole('link', { name: 'Football' })).toHaveAttribute('href', '/sports/football');
    expect(within(others).queryByRole('link', { name: 'Lawn tennis' })).not.toBeInTheDocument();
  });

  it('emits BreadcrumbList and WebPage structured data with absolute URLs', async () => {
    mockApi({ '/sports/tennis': { body: { data: tennis } }, '/sports': { body: { data: testSports } } });
    const { container } = render(await SportPage(params('tennis')));
    const [breadcrumb, page] = jsonLd(container);
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Lawn tennis',
      item: 'https://fitgeng.test/sports/tennis',
    });
    expect(page).toMatchObject({ '@type': 'WebPage', name: 'Lawn tennis', url: 'https://fitgeng.test/sports/tennis' });
    // Nothing invented: no ratings or addresses.
    expect(JSON.stringify(page)).not.toMatch(/aggregateRating|address/);
  });

  it('escapes API content inside JSON-LD so it cannot break out of the script tag', async () => {
    const evil = sport('evil', 'Evil', { description: '</script><script>alert(1)</script>' });
    mockApi({ '/sports/evil': { body: { data: evil } }, '/sports': { body: { data: [evil] } } });
    const { container } = render(await SportPage(params('evil')));
    const raw = container.querySelector('script[type="application/ld+json"]')!.innerHTML;
    expect(raw).not.toContain('</script>');
    expect(raw).toContain('\\u003c/script>');
  });

  it('still renders when the related-sports request fails', async () => {
    mockApi({ '/sports/tennis': { body: { data: tennis } }, '/sports': { status: 500, body: {} } });
    render(await SportPage(params('tennis')));
    expect(screen.getByRole('heading', { level: 1, name: 'Lawn tennis' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Other sports' })).not.toBeInTheDocument();
  });

  it('returns 404 for unknown or inactive sports', async () => {
    mockApi({});
    await expect(SportPage(params('curling'))).rejects.toThrow('NOT_FOUND');
    expect(navigationMock.notFound).toHaveBeenCalled();
  });

  it('generates unique, data-driven metadata per sport', async () => {
    const football = testSports[1]!;
    mockApi({ '/sports/tennis': { body: { data: tennis } }, '/sports/football': { body: { data: football } } });
    const a = await generateMetadata(params('tennis'));
    const b = await generateMetadata(params('football'));

    expect(a.title).toBe('Lawn tennis: training groups, coaches and games');
    expect(a.description).toContain(tennis.description);
    expect(a.alternates?.canonical).toBe('/sports/tennis');
    expect(a.openGraph).toMatchObject({ url: '/sports/tennis', title: expect.stringContaining('Lawn tennis') });
    expect(a.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(b.title).not.toBe(a.title);
    expect(b.description).not.toBe(a.description);
  });

  it('marks missing sports noindex in metadata', async () => {
    mockApi({});
    const meta = await generateMetadata(params('curling'));
    expect(meta.robots).toEqual({ index: false });
  });
});
