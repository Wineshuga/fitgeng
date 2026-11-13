import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { safeNextPath } from '@/lib/auth/redirect';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = { title: 'Log in' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).next;
  const next = typeof raw === 'string' ? raw : undefined;

  // Already signed in: go straight to where they were heading.
  if (await getSession()) redirect(safeNextPath(next, '/player'));

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back."
      footer={
        <>
          New here?{' '}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthCard>
  );
}
