import type { ErrorCode } from '../constants/errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
  };
}

export type DependencyStatus = 'up' | 'down' | 'disabled';

export interface HealthReport {
  status: 'ok' | 'degraded' | 'down';
  uptimeSeconds: number;
  version: string;
  dependencies: {
    mongo: DependencyStatus;
    redis: DependencyStatus;
  };
}
