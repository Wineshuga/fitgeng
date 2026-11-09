import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/config/brand';

export function BrandLogo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-extrabold tracking-tight">
      {brand.logoUrl ? (
        // The logo can be hosted anywhere (configured per deployment), so skip the image optimiser.
        <Image src={brand.logoUrl} alt="" width={32} height={32} unoptimized className="size-8 rounded-lg" />
      ) : (
        <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-on-brand" aria-hidden>
          {brand.name.charAt(0)}
        </span>
      )}
      <span className="text-lg">{brand.name}</span>
    </Link>
  );
}
