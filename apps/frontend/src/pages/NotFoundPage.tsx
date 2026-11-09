import { Link } from 'react-router';
import { buttonClasses } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold text-brand-600">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">This page doesn't exist or has moved.</p>
        <Link to="/" className={`${buttonClasses('primary')} mt-6`}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
