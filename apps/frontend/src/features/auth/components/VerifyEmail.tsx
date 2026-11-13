'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { buttonClasses } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/components/ui/QueryState';
import { useVerifyEmailMutation } from '../api';

/**
 * Verifies the emailed token once, on load. The token is single-use, so the ref
 * guard stops React's development double-effect from sending it twice (the
 * second call would fail and show a false error).
 */
export function VerifyEmail({ token }: { token?: string }) {
  const [verify, { isUninitialized, isLoading, isSuccess, error }] = useVerifyEmailMutation();
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    verify({ token });
  }, [token, verify]);

  if (!token) {
    return <Alert tone="error">This verification link is incomplete. Open the link from your email again.</Alert>;
  }
  if (isUninitialized || isLoading) {
    return (
      <div className="flex items-center gap-3 text-fg-muted" role="status">
        <Spinner /> Verifying your email…
      </div>
    );
  }
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">Your email is verified. You can now log in.</Alert>
        <Link href="/login" className={buttonClasses('primary', 'md', true)}>
          Log in
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="error">{getErrorMessage(error)}</Alert>
      <p className="text-sm text-fg-muted">
        Links expire after 24 hours and work once. Try logging in: you can request a new link from there.
      </p>
      <Link href="/login" className={buttonClasses('secondary', 'md', true)}>
        Go to log in
      </Link>
    </div>
  );
}
