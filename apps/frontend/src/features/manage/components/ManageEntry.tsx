import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Capability, SessionMembership } from '@fitgeng/shared';
import { BrandLogo } from '@/components/BrandLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Icon } from '@/components/Icon';
import { buttonClasses } from '@/components/ui/Button';

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', coach: 'Coach' } as const;

function EntryFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between border-b border-line px-4">
        <BrandLogo href="/manage" />
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12">{children}</main>
    </div>
  );
}

/** Shown at /manage when the user belongs to several organisations and none was opened before. */
export function OrgPicker({ memberships }: { memberships: SessionMembership[] }) {
  return (
    <EntryFrame>
      <h1 className="text-2xl font-extrabold tracking-tight">Choose an organisation</h1>
      <p className="mt-1 text-fg-muted">You can switch at any time from the sidebar.</p>
      <ul className="mt-6 flex flex-col gap-2">
        {memberships.map((m) => (
          <li key={m.orgId}>
            <Link
              href={`/manage/${m.slug}`}
              className="flex items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line hover:ring-brand-500"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-on-brand">
                <Icon name="building" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{m.name}</span>
                <span className="text-sm text-fg-subtle">{ROLE_LABEL[m.role]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </EntryFrame>
  );
}

/**
 * Shown at /manage when the user doesn't belong to any organisation yet. What it
 * offers depends on capabilities: approved coaches and organisers can create an
 * organisation; everyone else can apply for the capability.
 */
export function NoOrganisation({ capabilities }: { capabilities: Capability[] }) {
  const canCreate = capabilities.includes('coach') || capabilities.includes('organiser');
  return (
    <EntryFrame>
      <h1 className="text-2xl font-extrabold tracking-tight">
        {canCreate ? 'Set up your organisation' : 'Manage a team or academy'}
      </h1>
      <p className="mt-2 text-fg-muted">
        {canCreate
          ? 'Create your academy, club or community to start managing players, groups and schedules. Organisation setup arrives in Phase 3a.'
          : 'Management tools are for approved coaches and organisers. Applying for coach or organiser access arrives with accounts in Phase 2. If an organisation adds you as a coach, it will appear here.'}
      </p>
      <Link href="/player" className={`${buttonClasses('secondary')} mt-6`}>
        Go to my player area
      </Link>
    </EntryFrame>
  );
}
