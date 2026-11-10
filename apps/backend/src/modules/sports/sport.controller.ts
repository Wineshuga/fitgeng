import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { sportService } from './sport.service';

// Public reference data: let browsers and CDNs cache briefly.
const PUBLIC_CACHE = 'public, max-age=300, stale-while-revalidate=3600';

export async function listSports(_req: Request, res: Response): Promise<void> {
  const sports = await sportService.listActive();
  res.setHeader('Cache-Control', PUBLIC_CACHE);
  sendSuccess(res, sports);
}

export async function getSport(req: Request, res: Response): Promise<void> {
  const { slug } = req.validated.params as { slug: string };
  const sport = await sportService.getActiveBySlug(slug);
  res.setHeader('Cache-Control', PUBLIC_CACHE);
  sendSuccess(res, sport);
}
