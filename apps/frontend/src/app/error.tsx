'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

/** Error boundary for route segments. Shows a safe message and never the error details. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="grid min-h-[60dvh] place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-fg-muted">Please try again. If it keeps happening, contact support.</p>
        {error.digest && <p className="mt-2 text-xs text-fg-subtle">Reference: {error.digest}</p>}
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
