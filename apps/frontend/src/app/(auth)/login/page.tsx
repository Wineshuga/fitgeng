import type { Metadata } from 'next';
import { UpcomingFeature } from '@/components/UpcomingFeature';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return <UpcomingFeature title="Log in" description="Sign in to your account." availability="Phase 2" />;
}
