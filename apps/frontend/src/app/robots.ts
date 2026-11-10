import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/metadata';

/**
 * Crawling rules. robots.txt is a courtesy to crawlers, not access control:
 * private areas are protected by authentication and API authorisation. Account
 * pages stay crawlable so crawlers can see their `noindex` tag.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/manage/', '/player/', '/api/'] }],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
