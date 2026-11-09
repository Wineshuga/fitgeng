import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { ERROR_CODES, type ApiErrorBody } from '@fitgeng/shared';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.path} not found`));
};

function isMongoDuplicateKey(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

/** Converts known error types into ApiErrors. Unknown errors return null and become a 500. */
function normalise(err: unknown): ApiError | null {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.badRequest(
      'Validation failed',
      err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    );
  }
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.badRequest(
      'Validation failed',
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    );
  }
  if (isMongoDuplicateKey(err)) {
    const fields = Object.keys(err.keyValue ?? {}).join(', ');
    return ApiError.conflict(fields ? `A record with this ${fields} already exists` : 'Duplicate record');
  }

  // body-parser errors carry a `type` and an HTTP status.
  const bp = err as { type?: string; status?: number };
  if (bp?.type === 'entity.too.large') {
    return new ApiError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, 'Request body is too large');
  }
  if (bp?.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON body');
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = normalise(err);
  const requestId = String(req.id ?? '');

  if (!apiError) {
    logger.error({ err, requestId }, 'Unhandled error');
  } else if (apiError.status >= 500) {
    logger.error({ err, requestId }, apiError.message);
  }

  const status = apiError?.status ?? 500;
  const body: ApiErrorBody = {
    error: {
      code: apiError?.code ?? ERROR_CODES.INTERNAL_ERROR,
      // Never leak internal messages or stack traces for unexpected errors.
      message: apiError?.message ?? 'Something went wrong. Please try again.',
      ...(apiError?.details ? { details: apiError.details } : {}),
      ...(requestId ? { requestId } : {}),
    },
  };
  res.status(status).json(body);
};
