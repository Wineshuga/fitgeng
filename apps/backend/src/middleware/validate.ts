import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

declare module 'express-serve-static-core' {
  interface Request {
    /** Parsed, validated input. Controllers read from here, never from raw req.body/query. */
    validated: { body?: unknown; query?: unknown; params?: unknown };
  }
}

/**
 * Validates request input against zod schemas. Only the parsed output (unknown
 * keys stripped or rejected) reaches controllers, which protects against mass
 * assignment. A ZodError is turned into a 400 response by the error handler.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.validated = {
      body: schemas.body ? schemas.body.parse(req.body) : undefined,
      query: schemas.query ? schemas.query.parse(req.query) : undefined,
      params: schemas.params ? schemas.params.parse(req.params) : undefined,
    };
    next();
  };
}
