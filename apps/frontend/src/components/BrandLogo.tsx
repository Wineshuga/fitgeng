import { Link } from 'react-router';
import { brand } from '@/config/brand';

export function BrandLogo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 font-extrabold tracking-tight">
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt="" className="size-8 rounded-lg" />
      ) : (
        <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white" aria-hidden>
          {brand.name.charAt(0)}
        </span>
      )}
      <span className="text-lg">{brand.name}</span>
    </Link>
  );
}
