import { paginationQuerySchema } from '@fitgeng/shared';
import { buildMeta, paginationWindow, parseSort } from '../pagination';
import { ApiError } from '../ApiError';

describe('pagination utilities', () => {
  it('applies defaults and coerces query strings', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationQuerySchema.parse({ page: '3', limit: '50' })).toMatchObject({ page: 3, limit: 50 });
  });

  it('caps the page size', () => {
    expect(() => paginationQuerySchema.parse({ limit: '500' })).toThrow();
  });

  it('computes skip and meta', () => {
    expect(paginationWindow({ page: 3, limit: 20 })).toEqual({ skip: 40, limit: 20 });
    expect(buildMeta(1, 20, 0)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 1 });
    expect(buildMeta(2, 20, 41)).toMatchObject({ totalPages: 3 });
  });

  it('parses allowed sort fields', () => {
    expect(parseSort('-createdAt,name', ['createdAt', 'name'], {})).toEqual({ createdAt: -1, name: 1 });
    expect(parseSort(undefined, ['name'], { createdAt: -1 })).toEqual({ createdAt: -1 });
  });

  it('rejects sort fields outside the allow-list', () => {
    expect(() => parseSort('passwordHash', ['name'], {})).toThrow(ApiError);
  });
});
