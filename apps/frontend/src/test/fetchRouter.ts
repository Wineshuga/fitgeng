/**
 * Test-only fetch mock that routes by "METHOD /path" and records every request
 * (method, path, headers, body), so tests can assert on what was sent.
 * The running app always calls the real API.
 */
export interface RecordedRequest {
  method: string;
  path: string;
  headers: Headers;
  body: unknown;
  credentials?: RequestCredentials;
}

type Handler = (req: RecordedRequest) => { status?: number; body?: unknown } | Promise<{ status?: number; body?: unknown }>;

export function fetchRouter(routes: Record<string, Handler>) {
  const calls: RecordedRequest[] = [];
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    const text = request.method === 'GET' ? '' : await request.text();
    const rec: RecordedRequest = {
      method: request.method,
      path: url.pathname.replace(/^\/api\/v1/, '') + url.search,
      headers: request.headers,
      body: text ? JSON.parse(text) : undefined,
      credentials: request.credentials,
    };
    calls.push(rec);
    const handler = routes[`${rec.method} ${url.pathname.replace(/^\/api\/v1/, '')}`];
    const { status = 200, body } = handler ? await handler(rec) : { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Not found' } } };
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return calls;
}

export const apiError = (status: number, code: string, message: string) => ({
  status,
  body: { error: { code, message } },
});

export const authUser = {
  id: 'u1',
  firstName: 'Ada',
  lastName: 'Obi',
  email: 'ada@example.com',
  capabilities: ['player'],
  isPlatformAdmin: false,
  emailVerified: true,
};

export const tokenResponse = (accessToken = 'access-1') => ({ body: { data: { accessToken, expiresIn: 900, user: authUser } } });
