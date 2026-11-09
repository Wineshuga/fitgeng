import { useGetHealthQuery } from './api';

const styles = {
  ok: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
  loading: 'bg-slate-400 animate-pulse',
} as const;

/** Small live indicator of API health, shown in the public footer. */
export function ApiStatus() {
  const { data, isLoading, isError } = useGetHealthQuery(undefined, { pollingInterval: 60_000 });

  const state = isLoading ? 'loading' : isError || !data ? 'down' : data.status;
  const label = {
    loading: 'Checking service…',
    ok: 'All systems operational',
    degraded: 'Running with reduced performance',
    down: 'Service unavailable',
  }[state];

  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" role="status">
      <span className={`size-2 rounded-full ${styles[state]}`} aria-hidden />
      {label}
    </span>
  );
}
