import type { PaginationMeta, PaginationQuery } from '@fitgeng/shared';
import { ApiError } from './ApiError';

export type SortSpec = Record<string, 1 | -1>;

/**
 * Turns "-createdAt,name" into { createdAt: -1, name: 1 }. Only fields in
 * `allowed` are accepted, so clients can't sort on unindexed or private fields.
 */
export function parseSort(sort: string | undefined, allowed: readonly string[], fallback: SortSpec): SortSpec {
  if (!sort) return fallback;
  const spec: SortSpec = {};
  for (const raw of sort.split(',')) {
    const desc = raw.startsWith('-');
    const field = desc ? raw.slice(1) : raw;
    if (!allowed.includes(field)) {
      throw ApiError.badRequest(`Cannot sort by "${field}"`, [
        { path: 'sort', message: `Allowed fields: ${allowed.join(', ')}` },
      ]);
    }
    spec[field] = desc ? -1 : 1;
  }
  return spec;
}

export function paginationWindow({ page, limit }: Pick<PaginationQuery, 'page' | 'limit'>) {
  return { skip: (page - 1) * limit, limit };
}

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
