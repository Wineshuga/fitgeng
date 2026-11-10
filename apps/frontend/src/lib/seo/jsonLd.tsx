import { brand } from '@/config/brand';
import { absoluteUrl } from './metadata';

type JsonLdObject = Record<string, unknown>;

/**
 * Renders structured data. `<` is escaped so content from the API can never
 * close the script tag (XSS). Only include properties backed by real data:
 * no invented ratings, addresses or opening hours.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function websiteJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.name,
    url: absoluteUrl('/'),
    description: brand.description,
    inLanguage: 'en-NG',
  };
}

export function organizationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.name,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icon'),
    email: brand.supportEmail,
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** A page about a sport. `about` is a plain Thing: schema.org has no Sport type. */
export function sportPageJsonLd(sport: { name: string; description: string }, path: string): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: sport.name,
    description: sport.description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: brand.name, url: absoluteUrl('/') },
    about: { '@type': 'Thing', name: sport.name },
    inLanguage: 'en-NG',
  };
}
