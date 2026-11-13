import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { renderWithProviders } from '@/test/renderWithProviders';
import { apiError, fetchRouter } from '@/test/fetchRouter';
import { DevEmailLink } from '../components/DevEmailLink';
import { RegisterForm } from '../components/RegisterForm';
import { LoginForm } from '../components/LoginForm';
import { ForgotPasswordForm } from '../components/PasswordForms';

jest.mock('next/navigation', () => ({ useRouter: jest.fn(), usePathname: jest.fn(() => '/') }));
(useRouter as jest.Mock).mockReturnValue({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() });

const VERIFY = 'http://localhost:3000/verify-email?token=dev_token_abcdefghijklmnopqrstuvwxyz12';
const RESET = 'http://localhost:3000/reset-password?token=dev_token_abcdefghijklmnopqrstuvwxyz12';

describe('DevEmailLink', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    (process.env as Record<string, string>).NODE_ENV = originalEnv!;
  });

  it('renders the emailed link as a same-site path, clearly marked development-only', () => {
    render(<DevEmailLink href={VERIFY} label="Open the verification link" />);
    expect(screen.getByText('Development only')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the verification link' })).toHaveAttribute(
      'href',
      '/verify-email?token=dev_token_abcdefghijklmnopqrstuvwxyz12',
    );
  });

  it('never renders in a production build, even if a link were present', () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const { container } = render(<DevEmailLink href={VERIFY} label="Open" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a link (e.g. real emails, or no email sent)', () => {
    const { container } = render(<DevEmailLink label="Open" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('dev links in the auth flows', () => {
  async function register() {
    await userEvent.type(screen.getByLabelText('First name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Last name'), 'Obi');
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  }

  it('shows the verification link after registering', async () => {
    fetchRouter({ 'POST /auth/register': () => ({ status: 202, body: { data: { message: 'ok', devLink: VERIFY } } }) });
    renderWithProviders(<RegisterForm />);
    await register();
    expect(await screen.findByRole('link', { name: 'Open the verification link' })).toHaveAttribute('href', expect.stringContaining('/verify-email?token='));
  });

  it('shows the new link after resending from the registration screen', async () => {
    const NEW = VERIFY.replace('dev_token', 'new_token');
    fetchRouter({
      'POST /auth/register': () => ({ status: 202, body: { data: { message: 'ok', devLink: VERIFY } } }),
      'POST /auth/resend-verification': () => ({ status: 202, body: { data: { message: 'ok', devLink: NEW } } }),
    });
    renderWithProviders(<RegisterForm />);
    await register();
    await userEvent.click(await screen.findByRole('button', { name: 'Resend the email' }));
    expect(await screen.findByText('A new link is on its way.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the verification link' })).toHaveAttribute('href', expect.stringContaining('new_token'));
  });

  it('shows the link after "Send a new link" on the login page', async () => {
    fetchRouter({
      'POST /auth/login': () => apiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email'),
      'POST /auth/resend-verification': () => ({ status: 202, body: { data: { message: 'ok', devLink: VERIFY } } }),
    });
    renderWithProviders(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Send a new link' }));
    expect(await screen.findByRole('link', { name: 'Open the verification link' })).toBeInTheDocument();
  });

  it('shows the reset link after "Forgot password"', async () => {
    fetchRouter({ 'POST /auth/forgot-password': () => ({ status: 202, body: { data: { message: 'ok', devLink: RESET } } }) });
    renderWithProviders(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByRole('link', { name: 'Open the password reset link' })).toHaveAttribute('href', expect.stringContaining('/reset-password?token='));
  });

  it('shows no dev link when the API sends none (production or real email)', async () => {
    fetchRouter({ 'POST /auth/register': () => ({ status: 202, body: { data: { message: 'ok' } } }) });
    renderWithProviders(<RegisterForm />);
    await register();
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
    expect(screen.queryByText('Development only')).not.toBeInTheDocument();
  });
});
