import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import { getHealth } from './health.service';

export function healthCheck(_req: Request, res: Response): void {
  const report = getHealth();
  sendSuccess(res, report, report.status === 'down' ? 503 : 200);
}
