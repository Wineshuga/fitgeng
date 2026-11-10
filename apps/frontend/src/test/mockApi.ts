import type { SportDto } from '@fitgeng/shared';

/** Test-only API responses, routed by URL path. The running app always calls the real API. */
type Route = { status?: number; body: unknown } | (() => never);

export function mockApi(routes: Record<string, Route>) {
  const fn = jest.fn(async (input: RequestInfo | URL) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const path = url.pathname.replace(/^\/api\/v1/, '');
    const route = routes[path];
    if (typeof route === 'function') return route();
    if (!route) return json(404, { error: { code: 'NOT_FOUND', message: 'Not found' } });
    return json(route.status ?? 200, route.body);
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const sport = (slug: string, name: string, extra: Partial<SportDto> = {}): SportDto => ({
  id: `id-${slug}`,
  name,
  slug,
  description: `${name} description for tests.`,
  format: 'individual',
  sortOrder: 10,
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...extra,
});

export const testSports = [sport('tennis', 'Lawn tennis'), sport('football', 'Football', { format: 'team', sortOrder: 20 })];

export const healthy = {
  data: { status: 'ok', uptimeSeconds: 1, version: '0.1.0', dependencies: { mongo: 'up', redis: 'up' } },
};
