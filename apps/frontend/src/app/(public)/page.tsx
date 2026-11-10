import Link from 'next/link';
import type { SportDto } from '@fitgeng/shared';
import { brand } from '@/config/brand';
import { buttonClasses } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/Icon';
import { getSports } from '@/features/sports/server';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonLd';
import { pageMetadata } from '@/lib/seo/metadata';

// Static page regenerated in the background at most every 5 minutes, so new sports appear.
export const revalidate = 300;

export const metadata = {
  ...pageMetadata({ title: brand.tagline, description: brand.description, path: '/' }),
  // The home page shows the bare brand title, not "<title> | <brand>".
  title: { absolute: `${brand.name} | ${brand.tagline}` },
};

const audiences: { title: string; body: string; icon: IconName }[] = [
  {
    title: 'For players',
    body: 'Find groups near you, join sessions, track your schedule and payments, all in one place.',
    icon: 'compass',
  },
  {
    title: 'For coaches',
    body: 'Run your academy: rosters, recurring schedules, attendance and membership fees without the spreadsheets.',
    icon: 'calendar',
  },
  {
    title: 'For organisers',
    body: 'Build teams, publish events, manage registrations and keep your community in the loop.',
    icon: 'trophy',
  },
];

export default async function LandingPage() {
  // The sports list is a progressive enhancement: if the API is down, the page still renders.
  const sports: SportDto[] = await getSports().catch(() => []);

  return (
    <>
      <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-128 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 size-112 rounded-full bg-accent-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:ring-brand-800">
            Now live in Lagos
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
            {brand.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-fg-muted">
            {brand.name} connects players, coaches and organisers. Discover sports communities, join training groups
            and manage everything from schedules to membership fees.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={buttonClasses('primary', 'lg')}>
              Join {brand.name}
            </Link>
            <Link href="/discover" className={buttonClasses('secondary', 'lg')}>
              Explore groups
            </Link>
          </div>
          {sports.length > 0 && (
            <ul className="mt-12 flex flex-wrap gap-2" aria-label="Supported sports">
              {sports.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/sports/${s.slug}`}
                    className="inline-block rounded-full bg-surface px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-line hover:ring-brand-500"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/sports" className="inline-block rounded-full px-4 py-2 text-sm text-fg-subtle hover:text-brand-600">
                  All sports
                </Link>
              </li>
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {audiences.map((a) => (
            <article key={a.title} className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-600 text-on-brand">
                <Icon name={a.icon} />
              </span>
              <h2 className="mt-4 text-lg font-bold">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{a.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
