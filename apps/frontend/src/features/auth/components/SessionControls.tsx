'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@fitgeng/shared';
import { useAppDispatch } from '@/hooks/store';
import { sessionUserHydrated } from '@/store/authSlice';
import { useLogoutMutation } from '../api';

/**
 * Passes the server-validated session user (no tokens) into Redux, so client
 * components know who is signed in. Renders nothing.
 */
export function AuthHydrator({ user }: { user: SessionUser }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(sessionUserHydrated(user));
  }, [dispatch, user]);
  return null;
}

/** Ends this device's session, clears client state and returns to the login page. */
export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const onClick = async () => {
    await logout().unwrap().catch(() => undefined);
    router.replace('/login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={className ?? 'rounded-xl px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-muted disabled:opacity-60'}
    >
      {isLoading ? 'Logging out…' : 'Log out'}
    </button>
  );
}
