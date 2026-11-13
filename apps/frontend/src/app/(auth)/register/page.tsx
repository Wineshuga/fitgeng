import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { brand } from '@/config/brand';
import { getSession } from '@/lib/auth/session';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = { title: 'Create your account' };

export default async function RegisterPage() {
  if (await getSession()) redirect('/player');

  return (
    <AuthCard
      title="Create your account"
      subtitle={`Join ${brand.name} to find groups, coaches and games near you.`}
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
