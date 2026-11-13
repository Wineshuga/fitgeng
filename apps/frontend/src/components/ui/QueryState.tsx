'use client';

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
    if (body?.error?.message) return body.error.message;
    // A 5xx without the API's error envelope came from the proxy (Next/Nginx), not
    // the API: the API is down or restarting.
    const status = typeof error.status === 'number' ? error.status : 'originalStatus' in error ? error.originalStatus : 0;
    if (status >= 500 || error.status === 'PARSING_ERROR') {
      return 'The service is temporarily unavailable. Please try again in a moment.';
    }
    return 'Something went wrong.';
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
 * Standard loading, error, empty and success rendering for client-fetched data
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
      <div role="alert" className="rounded-2xl border border-danger-line bg-danger-soft p-6 text-center">
        <p className="text-sm text-danger">{getErrorMessage(error)}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  if (isEmpty?.(data)) {
    return <>{empty ?? <p className="py-12 text-center text-sm text-fg-subtle">Nothing here yet.</p>}</>;
  }
  return <>{children(data)}</>;
}
