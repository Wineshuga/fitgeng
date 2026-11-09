'use client';

import { useGetHealthQuery } from './api';

const dot = {
  ok: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-danger',
  loading: 'bg-fg-subtle animate-pulse',
} as const;

const label = {
  loading: 'Checking service…',
  ok: 'All systems operational',
  degraded: 'Running with reduced performance',
  down: 'Service unavailable',
} as const;

/** Small live indicator of API health, shown in the public footer. */
export function ApiStatus() {
  const { data, isLoading, isError } = useGetHealthQuery(undefined, { pollingInterval: 60_000 });
  const state = isLoading ? 'loading' : isError || !data ? 'down' : data.status;

  return (
    <span className="inline-flex items-center gap-2 text-xs text-fg-subtle" role="status">
      <span className={`size-2 rounded-full ${dot[state]}`} aria-hidden />
      {label[state]}
    </span>
  );
}
