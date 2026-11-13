import { StrictMode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { apiError, fetchRouter, tokenResponse } from '@/test/fetchRouter';
import { credentialsReceived } from '@/store/authSlice';
import { makeStore } from '@/store/store';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { VerifyEmail } from '../components/VerifyEmail';
import { ForgotPasswordForm, ResetPasswordForm } from '../components/PasswordForms';
import { LogoutButton } from '../components/SessionControls';

jest.mock('next/navigation', () => ({ useRouter: jest.fn(), usePathname: jest.fn(() => '/') }));
const router = { replace: jest.fn(), refresh: jest.fn(), push: jest.fn() };
(useRouter as jest.Mock).mockReturnValue(router);

beforeEach(() => jest.clearAllMocks());

describe('LoginForm', () => {
  async function fillAndSubmit(email = 'ada@example.com', password = 'correct horse battery') {
    await userEvent.type(screen.getByLabelText('Email'), email);
    if (password) await userEvent.type(screen.getByLabelText('Password'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  }

  it('validates on the client with the shared schema, without calling the API', async () => {
    const calls = fetchRouter({});
    renderWithProviders(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('stores the token in memory and goes to a safe `next` path', async () => {
    const calls = fetchRouter({ 'POST /auth/login': () => tokenResponse('access-1') });
    const store = makeStore();
    renderWithProviders(<LoginForm next="/manage/ikoyi/payments" />, { store });
    await fillAndSubmit();

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/manage/ikoyi/payments'));
    expect(router.refresh).toHaveBeenCalled();
    expect(store.getState().auth).toMatchObject({ accessToken: 'access-1', status: 'authenticated' });
    expect(calls[0]!.body).toEqual({ email: 'ada@example.com', password: 'correct horse battery' });
    expect(window.localStorage.length).toBe(0); // the token is never persisted
  });

  it('refuses open redirects in `next`', async () => {
    fetchRouter({ 'POST /auth/login': () => tokenResponse() });
    renderWithProviders(<LoginForm next="//evil.example/phish" />);
    await fillAndSubmit();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/player'));
  });

  it('shows the API error for wrong credentials', async () => {
    fetchRouter({ 'POST /auth/login': () => apiError(401, 'UNAUTHENTICATED', 'Incorrect email or password') });
    renderWithProviders(<LoginForm />);
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('offers to resend the verification email for unverified accounts', async () => {
    const calls = fetchRouter({
      'POST /auth/login': () => apiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email'),
      'POST /auth/resend-verification': () => ({ status: 202, body: { data: { message: 'sent' } } }),
    });
    renderWithProviders(<LoginForm />);
    await fillAndSubmit();
    await userEvent.click(await screen.findByRole('button', { name: 'Send a new link' }));
    expect(await screen.findByText(/sent a new verification link/)).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/auth/resend-verification')!.body).toEqual({ email: 'ada@example.com' });
  });
});

describe('RegisterForm', () => {
  it('enforces the shared password policy before calling the API', async () => {
    const calls = fetchRouter({});
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('First name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Last name'), 'Obi');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Use at least 10 characters')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('shows the check-your-email state after registering', async () => {
    const calls = fetchRouter({ 'POST /auth/register': () => ({ status: 202, body: { data: { message: 'ok' } } }) });
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('First name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Last name'), 'Obi');
    await userEvent.type(screen.getByLabelText('Email'), 'Ada@Example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(calls[0]!.body).toEqual({ firstName: 'Ada', lastName: 'Obi', email: 'ada@example.com', password: 'correct horse battery' });
  });

  it('maps API field errors onto the form', async () => {
    fetchRouter({
      'POST /auth/register': () => ({
        status: 400,
        body: { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: [{ path: 'email', message: 'Email not allowed' }] } },
      }),
    });
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('First name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Last name'), 'Obi');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Email not allowed')).toBeInTheDocument();
  });
});

describe('VerifyEmail', () => {
  it('verifies exactly once, even under StrictMode double effects', async () => {
    const calls = fetchRouter({ 'POST /auth/verify-email': () => ({ body: { data: { message: 'ok' } } }) });
    renderWithProviders(
      <StrictMode>
        <VerifyEmail token="tok_abcdefghijklmnopqrstuvwxyz123456" />
      </StrictMode>,
    );
    expect(await screen.findByText(/Your email is verified/)).toBeInTheDocument();
    expect(calls.filter((c) => c.path === '/auth/verify-email')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('explains expired or used links', async () => {
    fetchRouter({ 'POST /auth/verify-email': () => apiError(400, 'VALIDATION_ERROR', 'This link is invalid or has expired. Request a new one.') });
    renderWithProviders(<VerifyEmail token="tok_abcdefghijklmnopqrstuvwxyz123456" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('invalid or has expired');
  });

  it('handles a missing token without calling the API', () => {
    const calls = fetchRouter({});
    renderWithProviders(<VerifyEmail />);
    expect(screen.getByRole('alert')).toHaveTextContent('incomplete');
    expect(calls).toHaveLength(0);
  });
});

describe('password reset forms', () => {
  it('confirms a forgot-password request without revealing whether the account exists', async () => {
    fetchRouter({ 'POST /auth/forgot-password': () => ({ status: 202, body: { data: { message: 'ok' } } }) });
    renderWithProviders(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'someone@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(/If an account exists/)).toBeInTheDocument();
  });

  it('requires matching passwords', async () => {
    const calls = fetchRouter({});
    renderWithProviders(<ResetPasswordForm token="tok_abcdefghijklmnopqrstuvwxyz123456" />);
    await userEvent.type(screen.getByLabelText('New password'), 'a brand new passphrase');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'something else entirely');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('resets the password and explains that all devices were signed out', async () => {
    const calls = fetchRouter({ 'POST /auth/reset-password': () => ({ body: { data: { message: 'ok' } } }) });
    renderWithProviders(<ResetPasswordForm token="tok_abcdefghijklmnopqrstuvwxyz123456" />);
    await userEvent.type(screen.getByLabelText('New password'), 'a brand new passphrase');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'a brand new passphrase');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText(/signed out on all devices/)).toBeInTheDocument();
    expect(calls[0]!.body).toEqual({ token: 'tok_abcdefghijklmnopqrstuvwxyz123456', password: 'a brand new passphrase' });
  });
});

describe('LogoutButton', () => {
  it('ends the session with the CSRF header, clears client state and returns to login', async () => {
    const calls = fetchRouter({ 'POST /auth/logout': () => ({ status: 204 }) });
    const store = makeStore();
    store.dispatch(credentialsReceived({ accessToken: 'access-1', user: { id: 'u1' } as never }));
    renderWithProviders(<LogoutButton />, { store });

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(calls[0]!.headers.get('x-requested-with')).toBe('fitgeng');
    expect(store.getState().auth).toEqual({ accessToken: null, user: null, status: 'anonymous' });
  });

  it('still clears local state when the network call fails', async () => {
    fetchRouter({ 'POST /auth/logout': () => ({ status: 500, body: { error: { code: 'INTERNAL_ERROR', message: 'x' } } }) });
    const store = makeStore();
    store.dispatch(credentialsReceived({ accessToken: 'access-1', user: { id: 'u1' } as never }));
    renderWithProviders(<LogoutButton />, { store });
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(store.getState().auth.status).toBe('anonymous'));
  });
});
