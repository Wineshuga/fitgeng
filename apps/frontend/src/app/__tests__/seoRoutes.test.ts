import { mockApi, testSports } from '@/test/mockApi';
import sitemap from '../sitemap';
import robots from '../robots';

describe('sitemap.xml', () => {
  it('lists public pages and every active sport with canonical absolute URLs', async () => {
    mockApi({ '/sports': { body: { data: testSports } } });
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toEqual([
      'https://fitgeng.test/',
      'https://fitgeng.test/sports',
      'https://fitgeng.test/sports/tennis',
      'https://fitgeng.test/sports/football',
    ]);
    expect(entries[2]!.lastModified).toEqual(new Date('2026-11-01T00:00:00.000Z'));
  });

  it('never includes private, account or API paths', async () => {
    mockApi({ '/sports': { body: { data: testSports } } });
    const urls = (await sitemap()).map((e) => e.url).join(' ');
    expect(urls).not.toMatch(/\/manage|\/player|\/login|\/register|\/api\//);
  });

  it('falls back to static pages when the API is unavailable', async () => {
    mockApi({ '/sports': { status: 503, body: {} } });
    expect((await sitemap()).map((e) => e.url)).toEqual(['https://fitgeng.test/', 'https://fitgeng.test/sports']);
  });
});

describe('robots.txt', () => {
  it('allows public pages, disallows private areas and points to the sitemap', () => {
    const r = robots();
    expect(r.rules).toEqual([{ userAgent: '*', allow: '/', disallow: ['/manage/', '/player/', '/api/'] }]);
    expect(r.sitemap).toBe('https://fitgeng.test/sitemap.xml');
  });
});
