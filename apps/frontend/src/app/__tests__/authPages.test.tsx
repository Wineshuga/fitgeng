import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockSessionApi, setCookies } from '@/test/serverMocks';
import { session } from '@/test/sessions';
import LoginPage from '../(auth)/login/page';
import RegisterPage from '../(auth)/register/page';
import VerifyEmailPage from '../(auth)/verify-email/page';

jest.mock('next/headers', () => jest.requireActual('@/test/serverMocks').headersMock);
jest.mock('next/navigation', () => ({
  ...jest.requireActual('@/test/serverMocks').navigationMock,
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
}));

const sp = (v: Record<string, string>) => ({ searchParams: Promise.resolve(v) });

describe('auth pages', () => {
  it('renders the login form for signed-out visitors', async () => {
    setCookies({});
    renderWithProviders(await LoginPage(sp({ next: '/manage' })));
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
  });

  it('sends signed-in users on to their (safe) destination', async () => {
    setCookies({ fg_rt: 't' });
    mockSessionApi(session(['player']));
    await expect(LoginPage(sp({ next: '/manage/ikoyi' }))).rejects.toThrow('REDIRECT:/manage/ikoyi');
    await expect(LoginPage(sp({ next: 'https://evil.example' }))).rejects.toThrow('REDIRECT:/player');
  });

  it('redirects signed-in users away from registration', async () => {
    setCookies({ fg_rt: 't' });
    mockSessionApi(session(['player']));
    await expect(RegisterPage()).rejects.toThrow('REDIRECT:/player');
  });

  it('passes the emailed token to the verification flow', async () => {
    setCookies({});
    globalThis.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch; // keep it pending
    renderWithProviders(await VerifyEmailPage(sp({ token: 'tok_abcdefghijklmnopqrstuvwxyz123456' })));
    expect(screen.getByRole('status')).toHaveTextContent('Verifying your email');
  });
});
