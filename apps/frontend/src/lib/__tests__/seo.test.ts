import { mockApi } from '@/test/mockApi';
import { ApiRequestError, apiGet } from '../api/server';
import { absoluteUrl, metaDescription, pageMetadata } from '../seo/metadata';

describe('apiGet (server-side API client)', () => {
  it('calls the internal API URL and unwraps the envelope', async () => {
    const fetchMock = mockApi({ '/sports': { body: { data: [1, 2] } } });
    expect(await apiGet<number[]>('/sports', { revalidate: 60, tags: ['sports'] })).toEqual([1, 2]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { next: unknown }];
    expect(url).toBe('http://localhost:4000/api/v1/sports');
    expect(init.next).toEqual({ revalidate: 60, tags: ['sports'] });
  });

  it('returns null for 404 so pages can render notFound()', async () => {
    mockApi({});
    expect(await apiGet('/sports/none')).toBeNull();
  });

  it('throws a typed error with the API message for other failures', async () => {
    mockApi({ '/sports': { status: 503, body: { error: { code: 'SERVICE_UNAVAILABLE', message: 'Down for maintenance' } } } });
    await expect(apiGet('/sports')).rejects.toEqual(expect.objectContaining({ status: 503, code: 'SERVICE_UNAVAILABLE' }));
    await expect(apiGet('/sports')).rejects.toBeInstanceOf(ApiRequestError);
  });
});

describe('SEO helpers', () => {
  it('builds absolute URLs on the canonical origin', () => {
    expect(absoluteUrl('/sports/tennis')).toBe('https://fitgeng.test/sports/tennis');
    expect(absoluteUrl()).toBe('https://fitgeng.test/');
  });

  it('builds complete page metadata', () => {
    const m = pageMetadata({ title: 'Football', description: 'Play football.', path: '/sports/football' });
    expect(m).toMatchObject({
      title: 'Football',
      description: 'Play football.',
      alternates: { canonical: '/sports/football' },
      openGraph: { url: '/sports/football', title: 'Football | FitGeng', siteName: 'FitGeng', locale: 'en_NG' },
      twitter: { card: 'summary_large_image', title: 'Football | FitGeng' },
    });
    expect(m.robots).toBeUndefined();
    expect(pageMetadata({ title: 'x', description: 'y', path: '/x', noindex: true }).robots).toEqual({ index: false, follow: true });
  });

  it('shortens long descriptions on a word boundary', () => {
    const long = 'word '.repeat(60).trim();
    const d = metaDescription(long);
    expect(d.length).toBeLessThanOrEqual(158);
    expect(d.endsWith('…')).toBe(true);
    expect(metaDescription('short')).toBe('short');
  });
});
