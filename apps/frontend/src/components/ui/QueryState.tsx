import type { ReactNode } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiErrorBody } from '@fitgeng/shared';
import { Spinner } from './Spinner';
import { Button } from './Button';

/** Pulls the user-facing message out of an RTK Query error. */
export function getErrorMessage(error: FetchBaseQueryError | SerializedError | undefined): string {
  if (!error) return 'Something went wrong.';
  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') return 'Unable to reach the server. Check your connection.';
    const body = error.data as Partial<ApiErrorBody> | undefined;
    return body?.error?.message ?? 'Something went wrong.';
  }
  return error.message ?? 'Something went wrong.';
}

interface QueryStateProps<T> {
  isLoading: boolean;
  error?: FetchBaseQueryError | SerializedError;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}

/**
 * Standard loading, error, empty and success rendering for data views
 * (architecture §6.4), so every feature handles all four states the same way.
 */
export function QueryState<T>({ isLoading, error, data, isEmpty, empty, onRetry, children }: QueryStateProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12 text-brand-600">
        <Spinner size="lg" />
      </div>
    );
  }
  if (error || data === undefined) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300">{getErrorMessage(error)}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  if (isEmpty?.(data)) {
    return <>{empty ?? <p className="py-12 text-center text-sm text-slate-500">Nothing here yet.</p>}</>;
  }
  return <>{children(data)}</>;
}
