/**
 * Fleet API route — /api/fleet
 *
 * Returns validated, deduplicated FleetSite records from Incorta.
 * The PAT is held server-side and never sent to the browser.
 */

import { Router, type Request, type Response } from 'express';
import { getFleetData } from '../services/dataCache.ts';

const router = Router();

// GET /api/fleet
router.get('/', async (_req: Request, res: Response) => {
  try {
    const entry = await getFleetData();
    res.json({
      status: entry.error ? 'error' : 'ok',
      refreshedAt: new Date(entry.fetchedAt).toISOString(),
      sites: entry.data.sites,
      error: entry.error ?? undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[/api/fleet]', msg);
    res.status(500).json({ status: 'error', sites: [], error: msg, refreshedAt: new Date().toISOString() });
  }
});

// GET /api/fleet/:siteId
router.get('/:siteId', async (req: Request, res: Response) => {
  try {
    const entry = await getFleetData();
    const site  = entry.data.sites.find(s => s.siteId === req.params.siteId);
    if (!site) return res.status(404).json({ status: 'error', error: 'Site not found' });
    res.json({ status: 'ok', site });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', error: msg });
  }
});

export default router;
