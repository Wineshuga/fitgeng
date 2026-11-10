import { brand } from '@/config/brand';
import { OG_SIZE, renderOgImage } from '@/lib/seo/ogImage';

// Default share image for every page without its own.
export const alt = `${brand.name}: ${brand.tagline}`;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return renderOgImage({ title: brand.tagline, subtitle: 'Sports groups, coaches and events in Lagos' });
}
