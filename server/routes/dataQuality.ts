import { Router, type Request, type Response } from 'express';
import { buildDataQualityReport, getLastRefreshedAt } from '../services/dataCache.ts';

const router = Router();

// GET /api/data-quality
router.get('/', async (_req: Request, res: Response) => {
  try {
    const report = await buildDataQualityReport();
    res.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/data-quality]', msg);
    res.status(500).json({ error: msg });
  }
});

// GET /api/data-quality/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const report = await buildDataQualityReport();
    const fleetOk = report.fleetSource.status === 'ok';
    const caseOk  = report.caseSource.status === 'ok' || report.caseSource.status === 'unavailable';
    res.json({
      status: fleetOk && caseOk ? 'live' : fleetOk ? 'partial' : 'error',
      fleetSource: report.fleetSource.status,
      caseSource:  report.caseSource.status,
      lastRefreshedAt: getLastRefreshedAt(),
      uptime: process.uptime(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', error: msg });
  }
});

export default router;
