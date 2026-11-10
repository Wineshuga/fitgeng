'use client';

import { useId } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { resolveOrgPermissions, type Capability, type SessionMembership } from '@fitgeng/shared';
import { Icon } from '@/components/Icon';
import { allowedModuleKeys } from '../modules';

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', coach: 'Coach' } as const;

interface OrgSwitcherProps {
  current: SessionMembership;
  memberships: SessionMembership[];
  capabilities: Capability[];
}

/**
 * Switches the organisation being managed. It stays on the same module when the
 * user may use it in the target organisation, otherwise it falls back to that
 * organisation's overview. Users with one organisation see a plain label.
 *
 * A native <select> keeps this accessible and mobile-friendly without extra code.
 */
export function OrgSwitcher({ current, memberships, capabilities }: OrgSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const id = useId();

  if (memberships.length < 2) {
    return (
      <div className="rounded-xl bg-surface-muted px-3 py-2">
        <p className="truncate text-sm font-semibold">{current.name}</p>
        <p className="text-xs text-fg-subtle">{ROLE_LABEL[current.role]}</p>
      </div>
    );
  }

  const currentModule = pathname.split('/')[3];

  const onChange = (slug: string) => {
    const target = memberships.find((m) => m.slug === slug);
    if (!target || target.slug === current.slug) return;
    const allowed = allowedModuleKeys(resolveOrgPermissions(capabilities, target.role));
    const suffix = currentModule && allowed.includes(currentModule) ? `/${currentModule}` : '';
    router.push(`/manage/${target.slug}${suffix}`);
  };

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Organisation
      </label>
      <div className="relative">
        <select
          id={id}
          value={current.slug}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none truncate rounded-xl border border-line bg-surface-muted py-2 pr-9 pl-3 text-sm font-semibold"
        >
          {memberships.map((m) => (
            <option key={m.orgId} value={m.slug}>
              {m.name} ({ROLE_LABEL[m.role]})
            </option>
          ))}
        </select>
        <Icon name="chevronDown" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle" />
      </div>
    </div>
  );
}
