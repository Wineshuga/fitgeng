import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes';

/** Mounts every module router under /api/v1. New modules register here. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
