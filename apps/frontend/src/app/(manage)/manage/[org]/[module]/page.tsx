import type { Metadata } from 'next';
import { forbidden, notFound } from 'next/navigation';
import { requireManageContext } from '@/lib/auth/session';
import { getModule } from '@/features/manage/modules';
import { UpcomingFeature } from '@/components/UpcomingFeature';

type Params = Promise<{ org: string; module: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const def = getModule((await params).module);
  return { title: def?.label ?? 'Not found' };
}

/**
 * Fallback route for registered management modules. Once a module is built it
 * gets its own folder (e.g. [org]/players/page.tsx), which takes precedence over
 * this dynamic route, so modules can ship one at a time.
 *
 * Unknown module: 404. Known module without permission: 403. The API enforces
 * the same permission on every request regardless.
 */
export default async function ManageModulePage({ params }: { params: Params }) {
  const { org, module } = await params;
  const def = getModule(module);
  if (!def) notFound();

  const { permissions } = await requireManageContext(org);
  if (!permissions.includes(def.permission)) forbidden();

  return <UpcomingFeature title={def.label} description={def.description} availability={def.availability.phase} />;
}
