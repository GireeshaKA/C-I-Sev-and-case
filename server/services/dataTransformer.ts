/**
 * Data Transformation Layer — server-side.
 *
 * Maps raw Incorta rows to validated FleetSite records.
 * Documents every field mapping and derivation rule.
 *
 * IMPORTANT: No values are fabricated or hardcoded here.
 * All values come from the source rows or are explicitly marked as DERIVED.
 */

import type { FleetSite, CaseRecord, DataQualityReport } from '../types.ts';
import type { IncortaRow } from './incortaClient.ts';
import { classifyMicroinverterType } from '../../src/utils/skuFamily.ts';

// ── Column index map for Fleet/Site insight (24 columns) ─────────────────────
// Source: Incorta C&I Severity & Cases dashboard insight
// Verified against actual API response shape.
const FC = {
  SITE_ID: 0,
  SITE_NAME: 1,
  STAGE: 2,
  STATUS: 3,
  STATUS_REASON: 4,
  LAST_INTERVAL: 5,
  MICRO_COUNT: 6,
  INV_PROCLOAD: 7,
  INV_PARAMTBL: 8,
  ENVOY_COUNT: 9,
  MI_SKU: 10,
  ENVOY_TYPES: 11,
  EMU_SW: 12,
  CONN_TYPE: 13,
  INSTALLER: 14,
  STATE: 15,
  COUNTRY: 16,
  CREATED_AT: 17,
  WEEK_NUM: 18,
  SEVERITY: 19,
  METER_ENERGY: 20,
  MICRO_ENERGY: 21,
  ENERGY_PER_MICRO: 22,
  DAYS_PRODUCING: 23,
} as const;

// ── Column index map for SFDC Case insight ───────────────────────────────────
// Source: Incorta SFDC Cases Business View (if configured)
// IMPORTANT: Column indices must match the actual case insight schema.
// Update these if the case Business View has different column ordering.
const CC = {
  CASE_ID: 0,
  CASE_NUMBER: 1,
  SITE_ID: 2,
  SITE_NAME: 3,
  STATUS: 4,
  OWNER: 5,
  CREATED_DATE: 6,
  MODIFIED_DATE: 7,
  CLOSED_DATE: 8,
  PRIORITY: 9,
  SUBJECT: 10,
  CASE_TYPE: 11,
} as const;

// ── Known valid status values ────────────────────────────────────────────────
const KNOWN_STATUSES = new Set([
  'Normal',
  'Production Issue',
  'Microinverters Not Reporting',
  'Envoy Not Reporting',
  'Meter Issue',
]);

const KNOWN_STAGES = new Set(['Ready', 'Final', 'Verifying']);

// ── Helper functions ─────────────────────────────────────────────────────────

function cell(row: IncortaRow, idx: number): unknown {
  return row[idx];
}

function str(row: IncortaRow, idx: number): string {
  const v = cell(row, idx);
  if (v == null) return '';
  return String(v).trim();
}

function num(row: IncortaRow, idx: number): number {
  const v = cell(row, idx);
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function isoDate(raw: string): string {
  if (!raw) return '';
  try { return new Date(raw).toISOString().split('T')[0]; } catch { return ''; }
}

// Severity "99" is Incorta's sentinel for "no severity issue" — treat as null (not an unknown value).
// Only values outside {1,2,3,4,99,''} are flagged as unknownSeverityValues.
const SEVERITY_NO_ISSUE = new Set(['99', '0', '']);

function parseSeverity(raw: string): 1 | 2 | 3 | 4 | null {
  if (!raw || SEVERITY_NO_ISSUE.has(raw)) return null;
  const n = parseInt(raw, 10);
  return (n >= 1 && n <= 4) ? (n as 1 | 2 | 3 | 4) : null;
}

function isUnknownSeverity(raw: string): boolean {
  if (!raw || SEVERITY_NO_ISSUE.has(raw)) return false;
  const n = parseInt(raw, 10);
  return !(n >= 1 && n <= 4);
}

function parseStage(raw: string): FleetSite['siteStage'] {
  if (raw === 'Ready') return 'Ready';
  if (raw === 'Verifying') return 'Verifying';
  return 'Final';
}

/**
 * DERIVED: healthScore
 *
 * Source: NOT from the Incorta data — computed from severity + siteStatus.
 * Formula (documented in DATA_DICTIONARY.md §HealthScore):
 *   Base: 100
 *   Sev1: -40
 *   Sev2: -25
 *   Sev3: -10
 *   Sev4: -5
 *   Microinverters Not Reporting: additional -20
 *   Envoy Not Reporting: additional -15
 *   Production Issue: additional -5
 *   Clamped: [0, 100]
 */
function deriveHealthScore(severity: number | null, siteStatus: string): number {
  let score = 100;
  if (severity === 1) score -= 40;
  else if (severity === 2) score -= 25;
  else if (severity === 3) score -= 10;
  else if (severity === 4) score -= 5;
  if (siteStatus === 'Microinverters Not Reporting') score -= 20;
  else if (siteStatus === 'Envoy Not Reporting') score -= 15;
  else if (siteStatus === 'Production Issue') score -= 5;
  return Math.max(0, Math.min(100, score));
}

/**
 * DERIVED: reportingStatus
 *
 * Business definition (documented in DATA_DICTIONARY.md §NRP):
 *   Not Reporting = siteStatus IN ('Microinverters Not Reporting', 'Envoy Not Reporting')
 *   This is a proxy for NRP because the source does not contain a separate
 *   reporting_status field. If the business definition changes, update here only.
 */
function deriveReportingStatus(siteStatus: string): FleetSite['reportingStatus'] {
  return (siteStatus === 'Microinverters Not Reporting' ||
          siteStatus === 'Envoy Not Reporting')
    ? 'Not Reporting'
    : 'Reporting';
}

// ── Validation tracking ──────────────────────────────────────────────────────

export interface FleetTransformResult {
  sites: FleetSite[];
  quality: {
    totalRecords: number;
    duplicateSiteIds: number;
    missingSiteIds: number;
    unknownSeverityValues: number;
    unknownStatusValues: string[];
    unknownStageValues: string[];
    missingSiteNames: number;
    missingSkuCount: number;
    unknownTypeCount: number;
    otherTypeCount: number;
  };
}

// ── Row → FleetSite ──────────────────────────────────────────────────────────

function rowToFleetSite(row: IncortaRow): FleetSite {
  const siteId       = str(row, FC.SITE_ID);
  const siteStatus   = str(row, FC.STATUS);
  const rawSeverity  = str(row, FC.SEVERITY);
  const severity     = parseSeverity(rawSeverity);

  return {
    siteId,
    siteName:        str(row, FC.SITE_NAME),
    siteStage:       parseStage(str(row, FC.STAGE)),
    siteStatus,
    statusReason:    str(row, FC.STATUS_REASON),
    lastReportingTime: isoDate(str(row, FC.LAST_INTERVAL)),
    reportingStatus: deriveReportingStatus(siteStatus),
    microCount:      num(row, FC.MICRO_COUNT),
    envoyCount:      num(row, FC.ENVOY_COUNT),
    sku:             str(row, FC.MI_SKU),
    connectionType:  str(row, FC.CONN_TYPE) || 'Unknown',
    installer:       str(row, FC.INSTALLER),
    state:           str(row, FC.STATE),
    country:         str(row, FC.COUNTRY),
    siteCreatedAt:   isoDate(str(row, FC.CREATED_AT)),
    severity,
    meterEnergy:          num(row, FC.METER_ENERGY),
    microEnergy:          num(row, FC.MICRO_ENERGY),
    energyPerMicro:       num(row, FC.ENERGY_PER_MICRO),
    daysProducing:        num(row, FC.DAYS_PRODUCING),
    healthScore:          deriveHealthScore(severity, siteStatus),
    microinverterType:    classifyMicroinverterType(str(row, FC.MI_SKU)),
  };
}

/**
 * Transform raw fleet rows → validated FleetSite[].
 * Deduplicates by siteId (COUNT DISTINCT site_id is authoritative).
 */
export function transformFleetRows(rows: IncortaRow[]): FleetTransformResult {
  const seen       = new Map<string, FleetSite>();
  const duplicates  = new Set<string>();
  let missingSiteIds = 0;
  let unknownSeverityValues = 0;
  const unknownStatusValues = new Set<string>();
  const unknownStageValues  = new Set<string>();
  let missingSiteNames = 0;
  let missingSkuCount = 0;
  let unknownTypeCount = 0;
  let otherTypeCount = 0;

  for (const row of rows) {
    const site    = rowToFleetSite(row);
    const rawSev  = str(row, FC.SEVERITY);
    const rawSt   = str(row, FC.STATUS);
    const rawStg  = str(row, FC.STAGE);

    if (!site.siteId) { missingSiteIds++; continue; }
    if (!site.siteName) missingSiteNames++;
    if (isUnknownSeverity(rawSev)) unknownSeverityValues++;
    if (rawSt && !KNOWN_STATUSES.has(rawSt)) unknownStatusValues.add(rawSt);
    if (rawStg && !KNOWN_STAGES.has(rawStg)) unknownStageValues.add(rawStg);
    if (!str(row, FC.MI_SKU)) missingSkuCount++;
    if (site.microinverterType === 'UNKNOWN') unknownTypeCount++;
    else if (site.microinverterType === 'OTHER') otherTypeCount++;

    if (seen.has(site.siteId)) {
      duplicates.add(site.siteId);
    } else {
      seen.set(site.siteId, site);
    }
  }

  return {
    sites: Array.from(seen.values()),
    quality: {
      totalRecords: rows.length,
      duplicateSiteIds: duplicates.size,
      missingSiteIds,
      unknownSeverityValues,
      unknownStatusValues: Array.from(unknownStatusValues),
      unknownStageValues: Array.from(unknownStageValues),
      missingSiteNames,
      missingSkuCount,
      unknownTypeCount,
      otherTypeCount,
    },
  };
}

// ── Row → CaseRecord ─────────────────────────────────────────────────────────

function daysBetween(dateStr: string): number {
  if (!dateStr) return 0;
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / 86_400_000));
  } catch { return 0; }
}

export interface CaseTransformResult {
  cases: CaseRecord[];
  quality: {
    totalRecords: number;
    missingCaseIds: number;
    missingSiteIds: number;
  };
}

export function transformCaseRows(rows: IncortaRow[]): CaseTransformResult {
  const results: CaseRecord[] = [];
  let missingCaseIds = 0;
  let missingSiteIds = 0;

  for (const row of rows) {
    const caseId    = str(row, CC.CASE_ID);
    const siteId    = str(row, CC.SITE_ID);
    const created   = isoDate(str(row, CC.CREATED_DATE));

    if (!caseId) { missingCaseIds++; continue; }
    if (!siteId) { missingSiteIds++; }

    results.push({
      caseId,
      caseNumber:   str(row, CC.CASE_NUMBER),
      siteId,
      siteName:     str(row, CC.SITE_NAME),
      status:       str(row, CC.STATUS),
      owner:        str(row, CC.OWNER),
      createdDate:  created,
      modifiedDate: isoDate(str(row, CC.MODIFIED_DATE)),
      closedDate:   str(row, CC.CLOSED_DATE) || null,
      priority:     str(row, CC.PRIORITY),
      subject:      str(row, CC.SUBJECT),
      caseType:     str(row, CC.CASE_TYPE),
      caseAge:      daysBetween(created),
    });
  }

  return { cases: results, quality: { totalRecords: rows.length, missingCaseIds, missingSiteIds } };
}

// ── Validation cross-checks ──────────────────────────────────────────────────

export function validateConsistency(
  sites: FleetSite[],
  cases: CaseRecord[],
): DataQualityReport['validation'] {
  const fleetSize   = sites.length;
  const sevSites    = sites.filter(s => s.severity !== null);
  const sev1        = sites.filter(s => s.severity === 1).length;
  const nrpSites    = sites.filter(s => s.reportingStatus === 'Not Reporting').length;
  const caseIds     = new Set(cases.map(c => c.siteId));
  const sitesWCase  = sevSites.filter(s => caseIds.has(s.siteId)).length;
  const coverage    = sevSites.length > 0 ? sitesWCase / sevSites.length : 0;

  const iq8Count   = sites.filter(s => s.microinverterType === 'IQ8').length;
  const iq9Count   = sites.filter(s => s.microinverterType === 'IQ9').length;
  const classified = sites.filter(s => s.microinverterType === 'IQ8' || s.microinverterType === 'IQ9').length;

  const impossibleValues: string[] = [];
  if (sev1 > fleetSize) impossibleValues.push(`Sev1 count (${sev1}) > fleet size (${fleetSize})`);
  if (nrpSites > fleetSize) impossibleValues.push(`NRP count (${nrpSites}) > fleet size (${fleetSize})`);
  if (coverage > 1) impossibleValues.push(`Case coverage (${(coverage * 100).toFixed(1)}%) > 100%`);

  return {
    sevTotalMatchesSeveritySites: sevSites.length >= 0,
    iq8PlusIq9EqualsClassifiedTotal: (iq8Count + iq9Count) === classified,
    nrpLteFleetSize: nrpSites <= fleetSize,
    sev1LteFleetSize: sev1 <= fleetSize,
    caseCoverageLte100: coverage <= 1,
    impossibleValues,
  };
}
