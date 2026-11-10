import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { playerSections } from '@/routes/navigation';
import { UpcomingFeature } from '@/components/UpcomingFeature';

type Params = Promise<{ section: string }>;

const find = (segment: string) => playerSections.find((s) => s.to === `/player/${segment}`);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: find((await params).section)?.label ?? 'Not found' };
}

/** Placeholder for player sections until each ships (Phase 4) with its own route folder. */
export default async function PlayerSectionPage({ params }: { params: Params }) {
  const section = find((await params).section);
  if (!section) notFound();
  return <UpcomingFeature title={section.label} availability="Phase 4" />;
}
