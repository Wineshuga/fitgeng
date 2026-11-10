import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buttonClasses } from '@/components/ui/Button';
import { brand } from '@/config/brand';
import { FORMAT_LABEL, getSport, getSports } from '@/features/sports/server';
import { JsonLd, breadcrumbJsonLd, sportPageJsonLd, type Crumb } from '@/lib/seo/jsonLd';
import { metaDescription, pageMetadata } from '@/lib/seo/metadata';

type Params = Promise<{ slug: string }>;

/**
 * Incremental static regeneration: no pages are built at build time (so Docker
 * builds never need a live API). Each sport page is rendered on its first
 * request, cached, and regenerated in the background at most every 5 minutes.
 * That matches the shortest data window on the page (the related-sports list);
 * Next always uses the shortest one. Unknown slugs return 404.
 */
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams(): { slug: string }[] {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const sport = await getSport(slug);
  if (!sport) return { title: 'Sport not found', robots: { index: false } };

  return pageMetadata({
    title: `${sport.name}: training groups, coaches and games`,
    description: metaDescription(`${sport.name} on ${brand.name}. ${sport.description}`),
    path: `/sports/${sport.slug}`,
  });
}

export default async function SportPage({ params }: { params: Params }) {
  const { slug } = await params;
  const sport = await getSport(slug);
  if (!sport) notFound();

  // Related links help visitors and crawlers move between sports. A failure here must not break the page.
  const others = (await getSports().catch(() => [])).filter((s) => s.slug !== sport.slug);

  const path = `/sports/${sport.slug}`;
  const crumbs: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Sports', path: '/sports' },
    { name: sport.name, path },
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={[breadcrumbJsonLd(crumbs), sportPageJsonLd(sport, path)]} />
      <Breadcrumbs crumbs={crumbs} />

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">
          {FORMAT_LABEL[sport.format]}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{sport.name}</h1>
        <p className="mt-4 text-lg text-fg-muted">{sport.description}</p>
      </header>

      <section aria-labelledby="get-started" className="mt-10 rounded-3xl bg-surface p-6 ring-1 ring-line sm:p-8">
        <h2 id="get-started" className="text-xl font-bold">
          Play {sport.name.toLowerCase()} with {brand.name}
        </h2>
        <p className="mt-2 max-w-2xl text-fg-muted">
          Join training groups run by coaches, find teams and partners, and keep track of your sessions and memberships.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={`/discover?sport=${sport.slug}`} className={buttonClasses('primary', 'lg')}>
            Find {sport.name.toLowerCase()} groups
          </Link>
          <Link href="/register" className={buttonClasses('secondary', 'lg')}>
            Create a free account
          </Link>
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="other-sports" className="mt-12">
          <h2 id="other-sports" className="text-lg font-bold">
            Other sports
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/sports/${s.slug}`}
                  className="inline-block rounded-full bg-surface px-4 py-2 text-sm font-medium ring-1 ring-line hover:ring-brand-500"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
