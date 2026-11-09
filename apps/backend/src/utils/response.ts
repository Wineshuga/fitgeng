import type { Response } from 'express';
import type { ApiSuccess, PaginationMeta } from '@fitgeng/shared';

export function sendSuccess<T>(res: Response, data: T, status = 200): void {
  const body: ApiSuccess<T> = { data };
  res.status(status).json(body);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  const body: ApiSuccess<T[]> = { data, meta };
  res.status(200).json(body);
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
