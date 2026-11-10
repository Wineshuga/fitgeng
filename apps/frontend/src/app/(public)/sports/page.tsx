import Link from 'next/link';
import type { SportDto } from '@fitgeng/shared';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { brand } from '@/config/brand';
import { FORMAT_LABEL, getSports } from '@/features/sports/server';
import { JsonLd, breadcrumbJsonLd, type Crumb } from '@/lib/seo/jsonLd';
import { pageMetadata } from '@/lib/seo/metadata';

// Rebuilt in the background at most every 5 minutes (ISR).
export const revalidate = 300;

export const metadata = pageMetadata({
  title: 'Sports',
  description: `Browse the sports on ${brand.name}: lawn tennis, football, basketball, swimming, padel and more. Find training groups, coaches and games in Lagos and across Nigeria.`,
  path: '/sports',
});

const crumbs: Crumb[] = [
  { name: 'Home', path: '/' },
  { name: 'Sports', path: '/sports' },
];

export default async function SportsPage() {
  let sports: SportDto[] | null;
  try {
    sports = await getSports();
  } catch {
    sports = null; // API unavailable: render the page shell, retried on the next revalidation.
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Sports</h1>
      <p className="mt-2 max-w-2xl text-fg-muted">
        Pick a sport to find training groups, coaches and games near you.
      </p>

      {sports === null ? (
        <p role="status" className="mt-10 text-fg-subtle">
          Sports are temporarily unavailable. Please check back shortly.
        </p>
      ) : sports.length === 0 ? (
        <p className="mt-10 text-fg-subtle">No sports are listed yet.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/sports/${s.slug}`}
                className="flex h-full flex-col rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-line transition hover:ring-brand-500"
              >
                <span className="text-xs font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">
                  {FORMAT_LABEL[s.format]}
                </span>
                <span className="mt-2 text-lg font-bold">{s.name}</span>
                <span className="mt-2 line-clamp-3 text-sm text-fg-muted">{s.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
