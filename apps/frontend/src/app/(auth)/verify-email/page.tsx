import type { Metadata } from 'next';
import { UpcomingFeature } from '@/components/UpcomingFeature';

export const metadata: Metadata = { title: 'Verify your email' };

export default function VerifyEmailPage() {
  return <UpcomingFeature title="Verify your email" availability="Phase 2" />;
}
