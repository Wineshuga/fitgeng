import Link from 'next/link';
import { requireManageContext } from '@/lib/auth/session';
import { buildNavSections, allowedModuleKeys } from '@/features/manage/modules';
import { Icon } from '@/components/Icon';

/**
 * Organisation overview. The statistics dashboard (players, sessions,
 * outstanding payments, recent activity) arrives with its data in Phases 3a–3c.
 * Until then this page lists the modules this user can open, straight from
 * their permissions.
 */
export default async function OrgOverviewPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { membership, permissions } = await requireManageContext(org);
  const sections = buildNavSections(allowedModuleKeys(permissions));

  return (
    <section>
      <h1 className="text-2xl font-extrabold tracking-tight">{membership.name}</h1>
      <p className="mt-1 text-fg-muted">
        Overview statistics arrive with players, sessions and payments (Phases 3a–3c).
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((s) => (
          <div key={s.section}>
            <h2 className="text-sm font-semibold tracking-wider text-fg-subtle uppercase">{s.label}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {s.modules.map((m) => (
                <li key={m.key}>
                  <Link
                    href={`/manage/${membership.slug}/${m.key}`}
                    className="flex h-full gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line hover:ring-brand-500"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      <Icon name={m.icon} />
                    </span>
                    <span>
                      <span className="block font-semibold">{m.label}</span>
                      <span className="text-sm text-fg-muted">{m.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
