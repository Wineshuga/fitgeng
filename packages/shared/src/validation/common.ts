import { z } from 'zod';
import { PAGINATION } from '../constants/platform';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/**
 * Pagination and sorting query. `sort` is a comma-separated list such as
 * "-createdAt,name". Each module checks the field names against its own allow-list.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PAGINATION.maxLimit).default(PAGINATION.defaultLimit),
  sort: z
    .string()
    .regex(/^-?[a-zA-Z.]+(,-?[a-zA-Z.]+)*$/, 'Invalid sort expression')
    .optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
