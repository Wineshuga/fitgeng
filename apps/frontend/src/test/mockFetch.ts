type Handler = (url: string, init?: RequestInit) => { status?: number; body: unknown } | Promise<{ status?: number; body: unknown }>;

/**
 * Replaces global fetch for a test. Tests only: the running app always calls the
 * real API (implementation rule 9).
 */
export function mockFetch(handler: Handler) {
  const fn = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const { status = 200, body } = await handler(url, init);
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}
