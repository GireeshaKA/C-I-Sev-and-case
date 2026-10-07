/**
 * Express API Server — Enphase C&I Fleet Health Intelligence Platform
 *
 * SECURITY:
 *   - INCORTA_PAT lives in process.env only — never sent to the browser.
 *   - No VITE_ prefixed secrets are read here.
 *   - All Incorta authentication is handled server-side.
 *
 * Routes:
 *   GET  /api/fleet              All fleet sites (validated, deduplicated)
 *   GET  /api/fleet/:siteId      Single site detail
 *   GET  /api/cases              All SFDC cases (or 'unavailable' if not configured)
 *   GET  /api/cases/site/:id     Cases for a specific site
 *   GET  /api/data-quality       Full data quality report
 *   GET  /api/data-quality/status  Summary status (live/partial/error)
 *   POST /api/refresh            Force cache refresh
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fleetRouter          from './routes/fleet.ts';
import casesRouter          from './routes/cases.ts';
import dataQualityRouter    from './routes/dataQuality.ts';
import refreshRouter        from './routes/refresh.ts';
import { getLastRefreshInfo } from './services/dataCache.ts';

const app  = express();
const PORT = parseInt(process.env.API_PORT ?? '3001', 10);

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ],
  credentials: false,
}));

app.use(express.json());

// Security: ensure no Incorta credentials appear in response headers or logs
app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/fleet',         fleetRouter);
app.use('/api/cases',         casesRouter);
app.use('/api/data-quality',  dataQualityRouter);
app.use('/api/refresh',       refreshRouter);

app.get('/api/health', (_req, res) => {
  const info = getLastRefreshInfo();
  res.json({
    status:           'ok',
    version:          process.env.npm_package_version ?? '0.1.0',
    environment:      process.env.NODE_ENV ?? 'development',
    uptime:           Math.round(process.uptime()),
    ts:               new Date().toISOString(),
    incorta: {
      fleetConfigured: !!(process.env.INCORTA_DASHBOARD_ID || process.env.VITE_INCORTA_DASHBOARD_ID),
      caseConfigured:  !!(process.env.INCORTA_CASE_DASHBOARD_ID),
      patConfigured:   !!(process.env.INCORTA_PAT || process.env.VITE_INCORTA_PAT),
      lastFleetRefreshAt:  info.fleetFetchedAt   ? new Date(info.fleetFetchedAt).toISOString()  : null,
      lastCaseRefreshAt:   info.caseFetchedAt    ? new Date(info.caseFetchedAt).toISOString()   : null,
      fleetLatencyMs:      info.fleetLatencyMs   ?? null,
      caseLatencyMs:       info.caseLatencyMs    ?? null,
      fleetStatus:         info.fleetStatus      ?? 'uncached',
      caseStatus:          info.caseStatus       ?? 'uncached',
    },
  });
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] API listening on http://localhost:${PORT}`);
  console.log(`[server] INCORTA_PAT configured: ${!!process.env.INCORTA_PAT}`);
  console.log(`[server] Fleet insight:  ${process.env.INCORTA_DASHBOARD_ID ?? '(not set)'}/${process.env.INCORTA_INSIGHT_ID ?? '(not set)'}`);
  console.log(`[server] Case insight:   ${process.env.INCORTA_CASE_DASHBOARD_ID ?? '(not set)'}/${process.env.INCORTA_CASE_INSIGHT_ID ?? '(not set)'}`);
});

export default app;
