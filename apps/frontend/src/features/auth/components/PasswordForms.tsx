'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { PASSWORD_MIN, emailOnlySchema, passwordSchema } from '@fitgeng/shared';
import { Button, buttonClasses } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { getErrorMessage } from '@/components/ui/QueryState';
import { validateForm } from '@/utils/forms';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../api';

/** Requests a reset link. The response is the same whether or not the email exists. */
export function ForgotPasswordForm() {
  const [forgot, { isLoading, isSuccess, error }] = useForgotPasswordMutation();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = validateForm(emailOnlySchema, { email });
    if (checked.errors) return setFieldError(checked.errors.email);
    setFieldError(undefined);
    await forgot(checked.data).unwrap().catch(() => undefined);
  };

  if (isSuccess) {
    return (
      <Alert tone="success">
        If an account exists for <strong>{email.trim().toLowerCase()}</strong>, we&apos;ve sent a link to reset your password. It expires in 1 hour.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error && <Alert tone="error">{getErrorMessage(error)}</Alert>}
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError} />
      <Button type="submit" loading={isLoading} fullWidth>
        Send reset link
      </Button>
    </form>
  );
}

/** Sets a new password with the emailed token. On success, every device is signed out (server-side). */
export function ResetPasswordForm({ token }: { token?: string }) {
  const [resetPassword, { isLoading, isSuccess, error }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">This reset link is incomplete or invalid.</Alert>
        <Link href="/forgot-password" className={buttonClasses('secondary', 'md', true)}>
          Request a new link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">Your password has been updated. For security, you&apos;ve been signed out on all devices.</Alert>
        <Link href="/login" className={buttonClasses('primary', 'md', true)}>
          Log in
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = passwordSchema.safeParse(password);
    const next: typeof errors = {};
    if (!checked.success) next.password = checked.error.issues[0]?.message;
    if (password !== confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;
    await resetPassword({ token, password }).unwrap().catch(() => undefined);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error && (
        <Alert tone="error">
          {getErrorMessage(error)}{' '}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new link
          </Link>
        </Alert>
      )}
      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters.`}
      />
      <TextField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />
      <Button type="submit" loading={isLoading} fullWidth>
        Update password
      </Button>
    </form>
  );
}
