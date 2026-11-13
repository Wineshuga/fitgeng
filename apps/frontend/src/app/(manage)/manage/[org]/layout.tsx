import type { ReactNode } from 'react';
import { requireManageContext } from '@/lib/auth/session';
import { allowedModuleKeys } from '@/features/manage/modules';
import { ManageShell } from '@/features/manage/components/ManageShell';
import { AuthHydrator } from '@/features/auth/components/SessionControls';

/**
 * Shell for one organisation's management area. Membership is verified on the
 * server: non-members get a 404, signed-out users go to /login. The client
 * shell receives only the module keys this user may see.
 */
export default async function OrgManageLayout({ children, params }: { children: ReactNode; params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { session, membership, permissions } = await requireManageContext(org);

  return (
    <ManageShell
      org={membership}
      memberships={session.memberships}
      capabilities={session.user.capabilities}
      allowedModules={allowedModuleKeys(permissions)}
      userName={`${session.user.firstName} ${session.user.lastName}`}
    >
      <AuthHydrator user={session.user} />
      {children}
    </ManageShell>
  );
}
