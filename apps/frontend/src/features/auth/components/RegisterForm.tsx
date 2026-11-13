'use client';

import { useState, type FormEvent } from 'react';
import { PASSWORD_MIN, registerSchema, type RegisterInput } from '@fitgeng/shared';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Alert } from '@/components/ui/Alert';
import { getErrorMessage } from '@/components/ui/QueryState';
import { apiFieldErrors, validateForm, type FieldErrors } from '@/utils/forms';
import { useRegisterMutation, useResendVerificationMutation } from '../api';

export function RegisterForm() {
  const [register, { isLoading, error, isSuccess }] = useRegisterMutation();
  const [resend, resendState] = useResendVerificationMutation();
  const [values, setValues] = useState<RegisterInput>({ firstName: '', lastName: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<RegisterInput>>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const checked = validateForm(registerSchema, values);
    if (checked.errors) return setErrors(checked.errors);
    setErrors({});
    await register(checked.data)
      .unwrap()
      .catch((err) => setErrors(apiFieldErrors<RegisterInput>(err)));
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">
          <p className="font-semibold">Check your email</p>
          <p className="mt-1">
            We sent a verification link to <strong>{values.email.trim().toLowerCase()}</strong>. Open it to activate your account.
          </p>
        </Alert>
        {resendState.isSuccess ? (
          <p className="text-sm text-fg-muted">A new link is on its way.</p>
        ) : (
          <Button variant="secondary" loading={resendState.isLoading} onClick={() => resend({ email: values.email })}>
            Resend the email
          </Button>
        )}
      </div>
    );
  }

  const set = (field: keyof RegisterInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error && Object.keys(apiFieldErrors(error)).length === 0 && <Alert tone="error">{getErrorMessage(error)}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="First name" autoComplete="given-name" value={values.firstName} onChange={set('firstName')} error={errors.firstName} />
        <TextField label="Last name" autoComplete="family-name" value={values.lastName} onChange={set('lastName')} error={errors.lastName} />
      </div>
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={values.email} onChange={set('email')} error={errors.email} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={set('password')}
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters. A short phrase is easy to remember and hard to guess.`}
      />
      <Button type="submit" loading={isLoading} fullWidth>
        Create account
      </Button>
    </form>
  );
}
