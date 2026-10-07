/**
 * Server-side canonical types.
 * These are the normalized records the backend produces and the frontend consumes.
 * Every field maps to a documented source or is explicitly marked optional.
 */

// ── Fleet / Site ────────────────────────────────────────────────────────────

/**
 * FleetSite — canonical, validated site record.
 *
 * Data contract (source: Incorta C&I Severity & Cases Business View):
 *   siteId           ← col 0  (site_id)
 *   siteName         ← col 1  (site_name)
 *   siteStage        ← col 2  (stage)
 *   siteStatus       ← col 3  (status)
 *   statusReason     ← col 4  (status_reason)
 *   lastReportingTime← col 5  (last_interval_end_date)  [NRP proxy]
 *   microCount       ← col 6  (micro_count)
 *   envoyCount       ← col 9  (envoy_count)
 *   sku              ← col 10 (mi_product_sku)
 *   connectionType   ← col 13 (connection_type)
 *   installer        ← col 14 (installer_name)
 *   state            ← col 15 (state)
 *   country          ← col 16 (country)
 *   siteCreatedAt    ← col 17 (site_created_at)
 *   severity         ← col 19 (severity)  — values: 1|2|3|4|null
 *   meterEnergy      ← col 20 (meter_energy)
 *   microEnergy      ← col 21 (micro_energy)
 *   energyPerMicro   ← col 22 (energy_per_micro_per_day)
 *   daysProducing    ← col 23 (days_producing)
 *
 *   healthScore      — DERIVED: NOT from source.
 *                      Formula: see DATA_DICTIONARY.md §HealthScore
 *                      Uses severity + siteStatus as inputs.
 *
 *   reportingStatus  — DERIVED from siteStatus:
 *                      'Not Reporting' when siteStatus is
 *                      'Microinverters Not Reporting' OR 'Envoy Not Reporting'
 */
export interface FleetSite {
  siteId: string;
  siteName: string;
  siteStage: 'Ready' | 'Final' | 'Verifying';
  siteStatus: string;
  statusReason: string;
  lastReportingTime: string;        // ISO date from last_interval_end_date
  reportingStatus: 'Reporting' | 'Not Reporting';
  microCount: number;
  envoyCount: number;
  sku: string;
  connectionType: string;
  installer: string;
  state: string;
  country: string;
  siteCreatedAt: string;
  severity: 1 | 2 | 3 | 4 | null;  // null = no severity issue
  meterEnergy: number;
  microEnergy: number;
  energyPerMicro: number;
  daysProducing: number;
  healthScore: number;              // DERIVED — see DATA_DICTIONARY.md
  microinverterType: 'IQ8' | 'IQ9' | 'OTHER' | 'UNKNOWN';  // DERIVED from sku via classifyMicroinverterType()
}

// ── Case / SFDC ─────────────────────────────────────────────────────────────

/**
 * CaseRecord — normalized SFDC case.
 *
 * Source: Incorta SFDC Case Business View (if configured).
 * If INCORTA_CASE_DASHBOARD_ID / INCORTA_CASE_INSIGHT_ID are not set,
 * case data is unavailable and the API returns status: 'unavailable'.
 */
export interface CaseRecord {
  caseId: string;
  caseNumber: string;
  siteId: string;
  siteName: string;
  status: string;
  owner: string;
  createdDate: string;
  modifiedDate: string;
  closedDate: string | null;
  priority: string;
  subject: string;
  caseType: string;
  caseAge: number;                  // days since createdDate
}

// ── Data Quality ─────────────────────────────────────────────────────────────

export interface DataQualityReport {
  generatedAt: string;
  fleetSource: {
    status: 'ok' | 'error' | 'unavailable';
    error?: string;
    totalRecordsRetrieved: number;
    distinctSiteIds: number;
    duplicateSiteIds: number;
    missingSiteIds: number;
    unknownSeverityValues: number;
    unknownSkuValues: number;
    unknownTypeCount: number;         // sites where type=UNKNOWN (no SKU or unclassifiable)
    otherTypeCount: number;           // sites where type=OTHER (non-IQ8/IQ9 prefix)
    missingSiteNames: number;
    missingReportingStatus: number;
    unknownStatusValues: string[];
    unknownStageValues: string[];
    apiLatencyMs: number;
  };
  caseSource: {
    status: 'ok' | 'error' | 'unavailable';
    error?: string;
    reason?: string;
    totalRecordsRetrieved: number;
    distinctCaseIds: number;
    casesWithNoSiteMatch: number;
    sitesWithAtLeastOneCase: number;
    sitesWithNoCase: number;
    joinMatchRate: string;
    apiLatencyMs: number;
  };
  validation: {
    sevTotalMatchesSeveritySites: boolean;
    iq8PlusIq9EqualsClassifiedTotal: boolean;
    nrpLteFleetSize: boolean;
    sev1LteFleetSize: boolean;
    caseCoverageLte100: boolean;
    impossibleValues: string[];
  };
}

// ── API Response wrappers ────────────────────────────────────────────────────

export interface ApiFleetResponse {
  status: 'ok' | 'error';
  refreshedAt: string;
  sites: FleetSite[];
  error?: string;
}

export interface ApiCasesResponse {
  status: 'ok' | 'error' | 'unavailable';
  refreshedAt: string;
  cases: CaseRecord[];
  error?: string;
  reason?: string;
}

export interface ApiStatusResponse {
  status: 'live' | 'partial' | 'error';
  fleetSource: 'ok' | 'error' | 'unavailable';
  caseSource: 'ok' | 'error' | 'unavailable';
  lastRefreshedAt: string | null;
  uptime: number;
}
