import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { ForgotPasswordForm } from '@/features/auth/components/PasswordForms';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={
        <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Back to log in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
