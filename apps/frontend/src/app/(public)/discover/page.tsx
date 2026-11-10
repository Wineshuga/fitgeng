import type { Metadata } from 'next';
import { UpcomingFeature } from '@/components/UpcomingFeature';

export const metadata: Metadata = {
  title: 'Discover sports groups, coaches and events',
  // Not indexed until it lists real groups (Phase 4); an empty page would hurt SEO.
  robots: { index: false, follow: true },
};

export default function DiscoverPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <UpcomingFeature
        title="Discover"
        description="Find training groups, coaches, teams and events near you, filtered by sport, area and level."
        availability="Phase 4"
      />
    </div>
  );
}
