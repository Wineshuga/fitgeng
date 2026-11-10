import { brand } from '@/config/brand';
import { FORMAT_LABEL, getSport } from '@/features/sports/server';
import { OG_SIZE, renderOgImage } from '@/lib/seo/ogImage';

export const alt = `Sport on ${brand.name}`;
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function SportOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const sport = await getSport((await params).slug).catch(() => null);
  if (!sport) return renderOgImage({ title: brand.tagline });
  return renderOgImage({ eyebrow: FORMAT_LABEL[sport.format], title: sport.name, subtitle: 'Training groups, coaches and games' });
}
