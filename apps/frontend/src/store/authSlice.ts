import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthTokenResponse, AuthUserDto, SessionUser } from '@fitgeng/shared';

/** The signed-in user as the UI needs it (session or login response). */
export type CurrentUser = SessionUser | AuthUserDto;

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

/**
 * Client authentication state. The access token lives here, in memory only:
 * never persisted, never rendered into HTML. A reload drops it, and the first
 * API call then refreshes it from the HttpOnly cookie (baseApi).
 */
export interface AuthState {
  accessToken: string | null;
  user: CurrentUser | null;
  status: AuthStatus;
}

export const initialAuthState: AuthState = { accessToken: null, user: null, status: 'unknown' };

export const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    /** After login or refresh. */
    credentialsReceived(state, action: PayloadAction<Pick<AuthTokenResponse, 'accessToken' | 'user'>>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = 'authenticated';
    },
    /** From the server-validated session (no token): lets the UI know who is signed in. */
    sessionUserHydrated(state, action: PayloadAction<SessionUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    loggedOut(): AuthState {
      return { accessToken: null, user: null, status: 'anonymous' };
    },
  },
});

export const { credentialsReceived, sessionUserHydrated, loggedOut } = authSlice.actions;
