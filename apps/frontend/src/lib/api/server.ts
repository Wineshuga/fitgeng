import 'server-only';
import type { ApiErrorBody, ApiSuccess } from '@fitgeng/shared';
import { serverEnv } from '@/lib/serverEnv';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface ServerGetOptions {
  /** Seconds the response may be reused (ISR). `false` caches until revalidated by tag. */
  revalidate?: number | false;
  /** Cache tags, so data can later be revalidated on demand. */
  tags?: string[];
}

/**
 * Reads public data from Express in Server Components (internal URL, never
 * exposed to browsers). Unwraps the API envelope. Returns null for 404, so pages
 * can call notFound(). Other failures throw: Next keeps serving the last good
 * page and the error boundary handles first renders.
 *
 * Authenticated requests don't belong here (see lib/auth/session.ts).
 */
export async function apiGet<T>(path: string, { revalidate = 300, tags }: ServerGetOptions = {}): Promise<T | null> {
  const res = await fetch(`${serverEnv.internalApiUrl}${path}`, {
    headers: { accept: 'application/json' },
    next: { revalidate, tags },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as Partial<ApiErrorBody> | null;
    throw new ApiRequestError(res.status, body?.error?.message ?? `API request failed (${res.status})`, body?.error?.code);
  }
  return ((await res.json()) as ApiSuccess<T>).data;
}
