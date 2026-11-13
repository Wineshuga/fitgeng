import type { ApiSuccess, AuthMessageResponse, AuthTokenResponse, LoginInput, RegisterInput } from '@fitgeng/shared';
import { baseApi, CSRF_HEADERS } from '@/services/baseApi';
import { credentialsReceived, loggedOut } from '@/store/authSlice';

type Message = AuthMessageResponse;
const unwrap = <T,>(res: ApiSuccess<T>) => res.data;

/** Auth endpoints. Tokens never touch storage: the access token goes to the auth slice, the refresh token stays in its HttpOnly cookie. */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthTokenResponse, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrap<AuthTokenResponse>,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: null }));
        if (data) dispatch(credentialsReceived(data));
      },
    }),
    register: build.mutation<Message, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: unwrap<Message>,
    }),
    verifyEmail: build.mutation<Message, { token: string }>({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
      transformResponse: unwrap<Message>,
    }),
    resendVerification: build.mutation<Message, { email: string }>({
      query: (body) => ({ url: '/auth/resend-verification', method: 'POST', body }),
      transformResponse: unwrap<Message>,
    }),
    forgotPassword: build.mutation<Message, { email: string }>({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
      transformResponse: unwrap<Message>,
    }),
    resetPassword: build.mutation<Message, { token: string; password: string }>({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
      transformResponse: unwrap<Message>,
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST', headers: CSRF_HEADERS }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Clear local state even if the network call fails: the user asked to leave.
        await queryFulfilled.catch(() => undefined);
        dispatch(loggedOut());
        dispatch(baseApi.util.resetApiState());
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
