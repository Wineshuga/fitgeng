import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIES } from '@fitgeng/shared';
import { requireSession } from '@/lib/auth/session';
import { NoOrganisation, OrgPicker } from '@/features/manage/components/ManageEntry';

/**
 * /manage entry point. Opens the last-used organisation (if the user still
 * belongs to it), or the only one, otherwise offers a picker. Users with no
 * organisation get guidance based on their capabilities.
 */
export default async function ManageIndexPage() {
  const session = await requireSession('/manage');
  const { memberships } = session;

  if (memberships.length === 0) return <NoOrganisation capabilities={session.user.capabilities} />;

  const lastSlug = (await cookies()).get(COOKIES.lastOrg)?.value;
  const target = memberships.find((m) => m.slug === lastSlug) ?? (memberships.length === 1 ? memberships[0] : undefined);
  if (target) redirect(`/manage/${target.slug}`);

  return <OrgPicker memberships={memberships} />;
}
