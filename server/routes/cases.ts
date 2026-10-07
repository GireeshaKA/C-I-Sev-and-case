import { Router, type Request, type Response } from 'express';
import { getCaseData } from '../services/dataCache.ts';

const router = Router();

// GET /api/cases
router.get('/', async (_req: Request, res: Response) => {
  try {
    const entry = await getCaseData();
    const isMissingConfig = entry.error?.includes('not configured');
    res.json({
      status: isMissingConfig ? 'unavailable' : entry.error ? 'error' : 'ok',
      refreshedAt: new Date(entry.fetchedAt).toISOString(),
      cases: entry.data.cases,
      error: entry.error ?? undefined,
      reason: isMissingConfig ? 'SFDC case Business View not configured (INCORTA_CASE_INSIGHT_ID)' : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/cases]', msg);
    res.status(500).json({ status: 'error', cases: [], error: msg, refreshedAt: new Date().toISOString() });
  }
});

// GET /api/cases/site/:siteId
router.get('/site/:siteId', async (req: Request, res: Response) => {
  try {
    const entry = await getCaseData();
    const cases = entry.data.cases.filter(c => c.siteId === req.params.siteId);
    res.json({ status: entry.error ? 'error' : 'ok', cases, error: entry.error ?? undefined });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', cases: [], error: msg });
  }
});

export default router;
