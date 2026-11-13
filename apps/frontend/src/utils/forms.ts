import type { ZodType } from 'zod';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiErrorBody, ErrorCode } from '@fitgeng/shared';

export type FieldErrors<T> = Partial<Record<keyof T & string, string>>;

/**
 * Validates form values with the same zod schema the API uses. Returns parsed
 * data, or the first error message per field.
 */
export function validateForm<T>(schema: ZodType<T>, values: unknown): { data: T; errors?: never } | { data?: never; errors: FieldErrors<T> } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '');
    errors[key] ??= issue.message;
  }
  return { errors: errors as FieldErrors<T> };
}

/** The API error code from an RTK Query error, if any. */
export function apiErrorCode(error: FetchBaseQueryError | SerializedError | undefined): ErrorCode | undefined {
  if (!error || !('status' in error)) return undefined;
  return (error.data as Partial<ApiErrorBody> | undefined)?.error?.code;
}

/** Field-level messages returned by the API (400 details), keyed by field. */
export function apiFieldErrors<T>(error: FetchBaseQueryError | SerializedError | undefined): FieldErrors<T> {
  if (!error || !('status' in error)) return {};
  const details = (error.data as Partial<ApiErrorBody> | undefined)?.error?.details ?? [];
  return Object.fromEntries(details.filter((d) => d.path).map((d) => [d.path, d.message])) as FieldErrors<T>;
}
