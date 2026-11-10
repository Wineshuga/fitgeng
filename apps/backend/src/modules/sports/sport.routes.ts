import { Router } from 'express';
import { sportSlugParamsSchema } from '@fitgeng/shared';
import { validate } from '../../middleware/validate';
import { getSport, listSports } from './sport.controller';

/** Public, read-only. Admin create/update/deactivate arrives with auth (Phase 2). */
export const sportsRouter = Router();

sportsRouter.get('/', listSports);
sportsRouter.get('/:slug', validate({ params: sportSlugParamsSchema }), getSport);
