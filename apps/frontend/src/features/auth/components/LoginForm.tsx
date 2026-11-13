'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginInput } from '@fitgeng/shared';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { getErrorMessage } from '@/components/ui/QueryState';
import { safeNextPath } from '@/lib/auth/redirect';
import { apiErrorCode, validateForm, type FieldErrors } from '@/utils/forms';
import { useLoginMutation, useResendVerificationMutation } from '../api';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [login, { isLoading, error, reset }] = useLoginMutation();
  const [resend, resendState] = useResendVerificationMutation();
  const [values, setValues] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});

  const notVerified = apiErrorCode(error) === 'EMAIL_NOT_VERIFIED';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    reset();
    const checked = validateForm(loginSchema, values);
    if (checked.errors) return setErrors(checked.errors);
    setErrors({});
    try {
      await login(checked.data).unwrap();
      // Only same-site paths: never an open redirect.
      router.replace(safeNextPath(next, '/player'));
      router.refresh(); // re-render server components with the new session cookie
    } catch {
      /* shown below */
    }
  };

  const set = (field: keyof LoginInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error && !notVerified && <Alert tone="error">{getErrorMessage(error)}</Alert>}
      {notVerified && (
        <Alert tone="info">
          <p>Please verify your email address first. Check your inbox for the link.</p>
          {resendState.isSuccess ? (
            <p className="mt-2 font-medium">We&apos;ve sent a new verification link.</p>
          ) : (
            <button
              type="button"
              className="mt-2 font-semibold underline"
              disabled={resendState.isLoading}
              onClick={() => resend({ email: values.email })}
            >
              Send a new link
            </button>
          )}
        </Alert>
      )}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set('email')} error={errors.email} />
      <TextField label="Password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password} />
      <div className="text-right text-sm">
        <Link href="/forgot-password" className="text-brand-700 hover:underline dark:text-brand-300">
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" loading={isLoading} fullWidth>
        Log in
      </Button>
    </form>
  );
}
