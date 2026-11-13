import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { VerifyEmail } from '@/features/auth/components/VerifyEmail';

export const metadata: Metadata = { title: 'Verify your email' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).token;
  return (
    <AuthCard title="Verify your email">
      <VerifyEmail token={typeof raw === 'string' ? raw : undefined} />
    </AuthCard>
  );
}
