/**
 * Helpers for testing Server Components and server modules.
 * Use with:
 *   jest.mock('next/headers', () => jest.requireActual('@/test/serverMocks').headersMock);
 *   jest.mock('next/navigation', () => jest.requireActual('@/test/serverMocks').navigationMock);
 */
import type { Session } from '@fitgeng/shared';

const cookieJar = new Map<string, string>();

export const headersMock = {
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    has: (name: string) => cookieJar.has(name),
  }),
};

/** Next's navigation interrupts throw; these mocks throw recognisable errors instead. */
export const navigationMock = {
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: jest.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  forbidden: jest.fn(() => {
    throw new Error('FORBIDDEN');
  }),
  usePathname: jest.fn(() => '/'),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
};

export function setCookies(values: Record<string, string>) {
  cookieJar.clear();
  for (const [k, v] of Object.entries(values)) cookieJar.set(k, v);
}

/** Makes the mocked API answer GET /auth/session with this session (or a status code). */
export function mockSessionApi(result: Session | number) {
  const fn = jest.fn(async () =>
    typeof result === 'number'
      ? new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'x' } }), { status: result })
      : new Response(JSON.stringify({ data: result }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  );
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}
