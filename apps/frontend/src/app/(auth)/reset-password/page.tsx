import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { ResetPasswordForm } from '@/features/auth/components/PasswordForms';

export const metadata: Metadata = { title: 'Choose a new password' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).token;
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm token={typeof raw === 'string' ? raw : undefined} />
    </AuthCard>
  );
}
