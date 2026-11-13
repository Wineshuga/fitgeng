import { authSlice, credentialsReceived, initialAuthState, loggedOut, sessionUserHydrated } from '../authSlice';
import { authUser } from '@/test/fetchRouter';

const reduce = authSlice.reducer;

describe('auth slice', () => {
  it('starts unknown, with no token', () => {
    expect(reduce(undefined, { type: 'init' })).toEqual(initialAuthState);
    expect(initialAuthState).toEqual({ accessToken: null, user: null, status: 'unknown' });
  });

  it('stores credentials after login or refresh', () => {
    const s = reduce(undefined, credentialsReceived({ accessToken: 't1', user: authUser as never }));
    expect(s).toMatchObject({ accessToken: 't1', status: 'authenticated', user: { email: 'ada@example.com' } });
  });

  it('hydrates the user from the server session without a token', () => {
    const { emailVerified: _e, ...sessionUser } = authUser;
    const s = reduce(undefined, sessionUserHydrated(sessionUser as never));
    expect(s).toMatchObject({ accessToken: null, status: 'authenticated', user: { id: 'u1' } });
  });

  it('keeps an existing token when the session user is hydrated', () => {
    let s = reduce(undefined, credentialsReceived({ accessToken: 't1', user: authUser as never }));
    s = reduce(s, sessionUserHydrated(authUser as never));
    expect(s.accessToken).toBe('t1');
  });

  it('clears everything on logout', () => {
    const s = reduce(reduce(undefined, credentialsReceived({ accessToken: 't1', user: authUser as never })), loggedOut());
    expect(s).toEqual({ accessToken: null, user: null, status: 'anonymous' });
  });
});
