import type { Metadata } from 'next';
import { brand } from '@/config/brand';
import { env } from '@/config/env';

/** Absolute URL on the canonical site origin (NEXT_PUBLIC_SITE_URL). */
export function absoluteUrl(path = '/'): string {
  return new URL(path, `${env.siteUrl}/`).toString();
}

interface PageSeo {
  /** Page title without the brand suffix (the root layout template adds it). */
  title: string;
  description: string;
  /** Canonical path, e.g. "/sports/tennis". Query strings are deliberately excluded. */
  path: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/**
 * Metadata for an indexable public page: unique title and description, a
 * canonical URL, Open Graph and X/Twitter cards. Images come from the
 * opengraph-image files in the route tree.
 */
export function pageMetadata({ title, description, path, type = 'website', noindex = false }: PageSeo): Metadata {
  const fullTitle = `${title} | ${brand.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      title: fullTitle,
      description,
      siteName: brand.name,
      locale: 'en_NG',
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Shortens text to a meta-description length on a word boundary. */
export function metaDescription(text: string, max = 158): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
