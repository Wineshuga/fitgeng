import { makeStore } from '@/store/store';
import { baseApi } from '../baseApi';
import { credentialsReceived } from '@/store/authSlice';
import { apiError, authUser, fetchRouter, tokenResponse } from '@/test/fetchRouter';

// A protected test endpoint standing in for any authenticated API call.
const testApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    secret: b.query<string, number>({ query: (n) => `/secret?n=${n}` }),
  }),
});

const secretRoute = (validToken: string) => (req: { headers: Headers }) =>
  req.headers.get('authorization') === `Bearer ${validToken}`
    ? { body: 'ok' }
    : apiError(401, 'TOKEN_EXPIRED', 'Access token expired');

describe('baseQueryWithReauth', () => {
  it('sends the in-memory access token as a Bearer header', async () => {
    const store = makeStore();
    store.dispatch(credentialsReceived({ accessToken: 'access-1', user: authUser as never }));
    const calls = fetchRouter({ 'GET /secret': secretRoute('access-1') });

    const result = await store.dispatch(testApi.endpoints.secret.initiate(1));
    expect(result.data).toBe('ok');
    expect(calls[0]!.headers.get('authorization')).toBe('Bearer access-1');
  });

  it('refreshes once on 401, stores the new token and retries the request', async () => {
    const store = makeStore();
    store.dispatch(credentialsReceived({ accessToken: 'expired', user: authUser as never }));
    const calls = fetchRouter({ 'GET /secret': secretRoute('access-2'), 'POST /auth/refresh': () => tokenResponse('access-2') });

    const result = await store.dispatch(testApi.endpoints.secret.initiate(1));
    expect(result.data).toBe('ok');
    expect(store.getState().auth).toMatchObject({ accessToken: 'access-2', status: 'authenticated' });

    const refresh = calls.find((c) => c.path === '/auth/refresh')!;
    expect(refresh.headers.get('x-requested-with')).toBe('fitgeng'); // CSRF header required by the API
    expect(refresh.credentials).toBe('include'); // sends the HttpOnly cookie
    expect(calls.map((c) => c.path)).toEqual(['/secret?n=1', '/auth/refresh', '/secret?n=1']);
  });

  it('obtains a token after a page reload (no token yet) via the refresh cookie', async () => {
    const store = makeStore();
    fetchRouter({ 'GET /secret': secretRoute('fresh'), 'POST /auth/refresh': () => tokenResponse('fresh') });
    const result = await store.dispatch(testApi.endpoints.secret.initiate(1));
    expect(result.data).toBe('ok');
    expect(store.getState().auth.accessToken).toBe('fresh');
  });

  it('runs a single refresh for concurrent 401s', async () => {
    const store = makeStore();
    store.dispatch(credentialsReceived({ accessToken: 'expired', user: authUser as never }));
    const calls = fetchRouter({
      'GET /secret': secretRoute('access-2'),
      'POST /auth/refresh': async () => {
        await new Promise((r) => setTimeout(r, 20));
        return tokenResponse('access-2');
      },
    });

    const results = await Promise.all([1, 2, 3].map((n) => store.dispatch(testApi.endpoints.secret.initiate(n))));
    expect(results.map((r) => r.data)).toEqual(['ok', 'ok', 'ok']);
    expect(calls.filter((c) => c.path === '/auth/refresh')).toHaveLength(1);
  });

  it('signs out when the refresh fails', async () => {
    const store = makeStore();
    store.dispatch(credentialsReceived({ accessToken: 'expired', user: authUser as never }));
    fetchRouter({ 'GET /secret': secretRoute('never'), 'POST /auth/refresh': () => apiError(401, 'UNAUTHENTICATED', 'Session expired') });

    const result = await store.dispatch(testApi.endpoints.secret.initiate(1));
    expect(result.error).toMatchObject({ status: 401 });
    expect(store.getState().auth).toEqual({ accessToken: null, user: null, status: 'anonymous' });
  });

  it('never tries to refresh for auth endpoints (no loops)', async () => {
    const store = makeStore();
    const authApiProbe = baseApi.injectEndpoints({
      endpoints: (b) => ({ probe: b.mutation<unknown, void>({ query: () => ({ url: '/auth/login', method: 'POST', body: {} }) }) }),
    });
    const calls = fetchRouter({ 'POST /auth/login': () => apiError(401, 'UNAUTHENTICATED', 'Incorrect email or password') });
    await store.dispatch(authApiProbe.endpoints.probe.initiate());
    expect(calls.map((c) => c.path)).toEqual(['/auth/login']);
  });
});
