/**
 * In-memory data cache — server-side only.
 *
 * Centralises all Incorta data fetching so every React component
 * gets the same validated dataset without making independent API calls.
 */

import { queryIncortaInsight } from './incortaClient.ts';
import {
  transformFleetRows,
  transformCaseRows,
  validateConsistency,
  type FleetTransformResult,
  type CaseTransformResult,
} from './dataTransformer.ts';
import type { DataQualityReport } from '../types.ts';

// Accept both new server-only keys and old VITE_ keys (backward compat)
const FLEET_DASHBOARD_ID = process.env.INCORTA_DASHBOARD_ID ?? process.env.VITE_INCORTA_DASHBOARD_ID ?? '';
const FLEET_INSIGHT_ID   = process.env.INCORTA_INSIGHT_ID   ?? process.env.VITE_INCORTA_INSIGHT_ID   ?? '';
const CASE_DASHBOARD_ID  = process.env.INCORTA_CASE_DASHBOARD_ID  ?? '';
const CASE_INSIGHT_ID    = process.env.INCORTA_CASE_INSIGHT_ID    ?? '';

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  latencyMs: number;
  error: string | null;
}

let fleetCache: CacheEntry<FleetTransformResult> | null = null;
let caseCache:  CacheEntry<CaseTransformResult>  | null = null;
let lastRefreshedAt: string | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isStale(entry: { fetchedAt: number } | null): boolean {
  if (!entry) return true;
  return Date.now() - entry.fetchedAt > CACHE_TTL_MS;
}

export async function getFleetData(force = false): Promise<CacheEntry<FleetTransformResult>> {
  if (!force && !isStale(fleetCache)) return fleetCache!;

  if (!FLEET_DASHBOARD_ID || !FLEET_INSIGHT_ID) {
    const empty: CacheEntry<FleetTransformResult> = {
      data: {
        sites: [],
        quality: {
          totalRecords: 0, duplicateSiteIds: 0, missingSiteIds: 0,
          unknownSeverityValues: 0, unknownStatusValues: [],
          unknownStageValues: [], missingSiteNames: 0,
          missingSkuCount: 0, unknownTypeCount: 0, otherTypeCount: 0,
        },
      },
      fetchedAt: Date.now(),
      latencyMs: 0,
      error: 'INCORTA_DASHBOARD_ID or INCORTA_INSIGHT_ID not configured',
    };
    fleetCache = empty;
    return empty;
  }

  try {
    const result = await queryIncortaInsight({
      dashboardId: FLEET_DASHBOARD_ID,
      insightId: FLEET_INSIGHT_ID,
    });
    const transformed = transformFleetRows(result.rows);
    fleetCache = {
      data: transformed,
      fetchedAt: Date.now(),
      latencyMs: result.latencyMs,
      error: null,
    };
    lastRefreshedAt = new Date().toISOString();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    fleetCache = {
      data: {
        sites: [],
        quality: {
          totalRecords: 0, duplicateSiteIds: 0, missingSiteIds: 0,
          unknownSeverityValues: 0, unknownStatusValues: [],
          unknownStageValues: [], missingSiteNames: 0,
          missingSkuCount: 0, unknownTypeCount: 0, otherTypeCount: 0,
        },
      },
      fetchedAt: Date.now(),
      latencyMs: 0,
      error: msg,
    };
    console.error('[dataCache] Fleet fetch error:', msg);
  }
  return fleetCache!;
}

export async function getCaseData(force = false): Promise<CacheEntry<CaseTransformResult>> {
  if (!force && !isStale(caseCache)) return caseCache!;

  if (!CASE_DASHBOARD_ID || !CASE_INSIGHT_ID) {
    const empty: CacheEntry<CaseTransformResult> = {
      data: { cases: [], quality: { totalRecords: 0, missingCaseIds: 0, missingSiteIds: 0 } },
      fetchedAt: Date.now(),
      latencyMs: 0,
      error: 'INCORTA_CASE_DASHBOARD_ID or INCORTA_CASE_INSIGHT_ID not configured — case data unavailable',
    };
    caseCache = empty;
    return empty;
  }

  try {
    const result = await queryIncortaInsight({
      dashboardId: CASE_DASHBOARD_ID,
      insightId: CASE_INSIGHT_ID,
    });
    const transformed = transformCaseRows(result.rows);
    caseCache = {
      data: transformed,
      fetchedAt: Date.now(),
      latencyMs: result.latencyMs,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    caseCache = {
      data: { cases: [], quality: { totalRecords: 0, missingCaseIds: 0, missingSiteIds: 0 } },
      fetchedAt: Date.now(),
      latencyMs: 0,
      error: msg,
    };
    console.error('[dataCache] Case fetch error:', msg);
  }
  return caseCache!;
}

export function getLastRefreshedAt(): string | null {
  return lastRefreshedAt;
}

export interface LastRefreshInfo {
  fleetFetchedAt:  number | null;
  caseFetchedAt:   number | null;
  fleetLatencyMs:  number | null;
  caseLatencyMs:   number | null;
  fleetStatus:     'ok' | 'error' | 'uncached';
  caseStatus:      'ok' | 'error' | 'uncached' | 'unavailable';
}

export function getLastRefreshInfo(): LastRefreshInfo {
  return {
    fleetFetchedAt:  fleetCache?.fetchedAt ?? null,
    caseFetchedAt:   caseCache?.fetchedAt  ?? null,
    fleetLatencyMs:  fleetCache?.latencyMs ?? null,
    caseLatencyMs:   caseCache?.latencyMs  ?? null,
    fleetStatus:     !fleetCache ? 'uncached' : fleetCache.error ? 'error' : 'ok',
    caseStatus:      !caseCache  ? 'uncached' : !CASE_INSIGHT_ID ? 'unavailable' : caseCache.error ? 'error' : 'ok',
  };
}

export async function refreshAll(): Promise<void> {
  await Promise.all([getFleetData(true), getCaseData(true)]);
  lastRefreshedAt = new Date().toISOString();
}

export async function buildDataQualityReport(): Promise<DataQualityReport> {
  const fleet = await getFleetData();
  const cases = await getCaseData();

  const fq = fleet.data.quality;
  const cq = cases.data.quality;

  const sevSites    = fleet.data.sites.filter(s => s.severity !== null);
  const caseIds     = new Set(cases.data.cases.map(c => c.siteId));
  const sitesWithCase = sevSites.filter(s => caseIds.has(s.siteId)).length;
  const casesNoSite   = cases.data.cases.filter(c => !fleet.data.sites.find(s => s.siteId === c.siteId)).length;
  const joinRate      = sevSites.length > 0
    ? `${((sitesWithCase / sevSites.length) * 100).toFixed(1)}%` : 'N/A';

  const validation = validateConsistency(fleet.data.sites, cases.data.cases);

  return {
    generatedAt: new Date().toISOString(),
    fleetSource: {
      status: fleet.error ? 'error' : 'ok',
      error: fleet.error ?? undefined,
      totalRecordsRetrieved: fq.totalRecords,
      distinctSiteIds: fleet.data.sites.length,
      duplicateSiteIds: fq.duplicateSiteIds,
      missingSiteIds: fq.missingSiteIds,
      unknownSeverityValues: fq.unknownSeverityValues,
      unknownSkuValues: fq.missingSkuCount ?? 0,
      unknownTypeCount: fq.unknownTypeCount ?? 0,
      otherTypeCount:   fq.otherTypeCount   ?? 0,
      missingSiteNames: fq.missingSiteNames,
      missingReportingStatus: 0,
      unknownStatusValues: fq.unknownStatusValues,
      unknownStageValues: fq.unknownStageValues,
      apiLatencyMs: fleet.latencyMs,
    },
    caseSource: {
      status: !CASE_INSIGHT_ID ? 'unavailable'
            : cases.error ? 'error' : 'ok',
      error: cases.error ?? undefined,
      reason: !CASE_INSIGHT_ID ? 'INCORTA_CASE_INSIGHT_ID not configured' : undefined,
      totalRecordsRetrieved: cq.totalRecords,
      distinctCaseIds: cases.data.cases.length,
      casesWithNoSiteMatch: casesNoSite,
      sitesWithAtLeastOneCase: sitesWithCase,
      sitesWithNoCase: sevSites.length - sitesWithCase,
      joinMatchRate: joinRate,
      apiLatencyMs: cases.latencyMs,
    },
    validation,
  };
}

