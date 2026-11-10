/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { config, proxy } from '../proxy';

const req = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, 'http://localhost:3000'), { headers: cookie ? { cookie } : {} });

describe('proxy (signed-in area gate)', () => {
  it('protects /manage and /player only', () => {
    expect(config.matcher).toEqual(['/manage/:path*', '/player/:path*']);
  });

  it('redirects visitors without a session cookie to login, keeping the destination', () => {
    const res = proxy(req('/manage/ikoyi/payments?tab=due'));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('next')).toBe('/manage/ikoyi/payments?tab=due');
  });

  it('lets requests with a session cookie through (layouts then validate it with the API)', () => {
    const res = proxy(req('/player', 'fg_rt=abc'));
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
