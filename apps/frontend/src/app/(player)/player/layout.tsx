import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireSession } from '@/lib/auth/session';
import { PlayerLayout } from '@/layouts/PlayerLayout';
import { AuthHydrator } from '@/features/auth/components/SessionControls';

export const metadata: Metadata = {
  title: 'My sports',
  robots: { index: false, follow: false },
};

/** Signed-in player area. The session is checked on the server; signed-out visitors go to /login. */
export default async function PlayerAreaLayout({ children }: { children: ReactNode }) {
  const session = await requireSession('/player');
  return (
    <PlayerLayout>
      <AuthHydrator user={session.user} />
      {children}
    </PlayerLayout>
  );
}
