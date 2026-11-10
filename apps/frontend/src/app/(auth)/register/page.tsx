import type { Metadata } from 'next';
import { UpcomingFeature } from '@/components/UpcomingFeature';

export const metadata: Metadata = { title: 'Create your account' };

export default function RegisterPage() {
  return <UpcomingFeature title="Create your account" description="Join to find groups, coaches and events." availability="Phase 2" />;
}
