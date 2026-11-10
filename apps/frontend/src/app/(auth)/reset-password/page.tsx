import type { Metadata } from 'next';
import { UpcomingFeature } from '@/components/UpcomingFeature';

export const metadata: Metadata = { title: 'Choose a new password' };

export default function ResetPasswordPage() {
  return <UpcomingFeature title="Choose a new password" availability="Phase 2" />;
}
