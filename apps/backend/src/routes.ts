import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes';
import { sportsRouter } from './modules/sports/sport.routes';
import { authRouter, meRouter } from './modules/auth/auth.routes';

/** Mounts every module router under /api/v1. New modules register here. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/sports', sportsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/me', meRouter);
