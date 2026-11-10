import type { Metadata } from 'next';
import { UpcomingFeature } from '@/components/UpcomingFeature';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return <UpcomingFeature title="Reset your password" description="We'll email you a reset link." availability="Phase 2" />;
}
