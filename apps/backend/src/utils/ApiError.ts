import { ERROR_CODES, type ApiErrorDetail, type ErrorCode } from '@fitgeng/shared';

/**
 * An error that is safe to show to the client. Anything thrown that is not an
 * ApiError (or a known library error) becomes a generic 500 response.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Invalid request', details?: ApiErrorDetail[]) {
    return new ApiError(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }
  static unauthenticated(message = 'Authentication required') {
    return new ApiError(401, ERROR_CODES.UNAUTHENTICATED, message);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, ERROR_CODES.FORBIDDEN, message);
  }
  /** Also used for records in another organisation, so their existence isn't revealed. */
  static notFound(resource = 'Resource') {
    return new ApiError(404, ERROR_CODES.NOT_FOUND, `${resource} not found`);
  }
  static conflict(message: string) {
    return new ApiError(409, ERROR_CODES.CONFLICT, message);
  }
}
