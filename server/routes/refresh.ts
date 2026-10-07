import { Router, type Request, type Response } from 'express';
import { refreshAll, getLastRefreshedAt } from '../services/dataCache.ts';

const router = Router();

// POST /api/refresh
router.post('/', async (_req: Request, res: Response) => {
  try {
    const t0 = Date.now();
    await refreshAll();
    res.json({
      status: 'ok',
      message: 'Data refreshed successfully',
      refreshedAt: getLastRefreshedAt(),
      durationMs: Date.now() - t0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/refresh]', msg);
    res.status(500).json({ status: 'error', message: msg });
  }
});

export default router;
