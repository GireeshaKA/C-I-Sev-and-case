/**
 * BackendDataProvider — calls the Express API backend.
 *
 * SECURITY: This provider makes no direct Incorta calls.
 * The Incorta PAT is held server-side only (see server/services/incortaClient.ts).
 *
 * Data flow:
 *   React component
 *     → BackendDataProvider
 *     → /api/fleet or /api/cases  (via Vite proxy in dev / direct in prod)
 *     → Express backend (server/index.ts)
 *     → Incorta API (authenticated server-side)
 */

import type { DataProvider } from './DataProvider';
import type {
  Site, SfdcCase, SeverityDistribution, HistoricalSeverity,
  DashboardFilters, DashboardKpis, SeverityLevel,
} from '../types';
import { classifyMicroinverterType } from '../utils/skuFamily';
import type { FleetSite, CaseRecord, ApiFleetResponse, ApiCasesResponse, ApiStatusResponse } from '../../server/types';

// ── API Data Status ──────────────────────────────────────────────────────────

export type DataStatus = 'live' | 'partial' | 'error' | 'loading';

export interface DataSourceInfo {
  status: DataStatus;
  fleetSource: 'ok' | 'error' | 'unavailable';
  caseSource: 'ok' | 'error' | 'unavailable';
  lastRefreshedAt: string | null;
  fleetError?: string;
  caseError?: string;
  caseReason?: string;
}

// ── Mapping FleetSite → Site (for backward compat with existing pages) ────────

/**
 * Maps the server's FleetSite to the frontend's Site type.
 * Every field is sourced from the server response — no fabrication.
 *
 * Fields that cannot be sourced:
 *   - envoyType:          not in current insight → mapped to 'Unknown'
 *   - invProduced:        not in current insight → empty string
 *   - invParamBld:        not in current insight → empty string
 *   - severitySubcategory: derived from reportingStatus (server already derives it)
 *   - hasOpenCase:         not from fleet source; requires case join — set to false here,
 *                          corrected after case data arrives in AppContent
 */
function fleetSiteToSite(fs: FleetSite): Site {
  const hasNrp = fs.reportingStatus === 'Not Reporting';
  const sub: Site['severitySubcategory'] = fs.severity === null ? null
    : hasNrp ? 'a'
    : (fs.siteStatus === 'Production Issue' || fs.siteStatus === 'Meter Issue') ? 'b'
    : 'c';

  return {
    siteId:             fs.siteId,
    siteName:           fs.siteName,
    siteStage:          fs.siteStage,
    siteStatus:         fs.siteStatus as Site['siteStatus'],
    statusReason:       fs.statusReason,
    lastIntervalEndDate: fs.lastReportingTime,
    microCount:         fs.microCount,
    envoyCount:         fs.envoyCount,
    miProductSku:       fs.sku,
    envoyType:          'IQ Gateway Commercial' as Site['envoyType'],
    installerName:      fs.installer,
    state:              fs.state,
    country:            fs.country,
    connectionType:     (fs.connectionType as Site['connectionType']) || 'Ethernet',
    severity:           fs.severity,
    severitySubcategory: sub,
    invProduced:        '',
    invParamBld:        '',
    hasOpenCase:        false,  // corrected by joinCaseData below
    meterEnergy:        fs.meterEnergy,
    microEnergy:        fs.microEnergy,
    energyPerMicroPerDay: fs.energyPerMicro,
    daysProducing:      fs.daysProducing,
    siteCreatedAt:      fs.siteCreatedAt,
    emuSwVersion:       '',
    healthScore:        fs.healthScore,
    microinverterType:  fs.microinverterType ?? classifyMicroinverterType(fs.sku),
  };
}

/**
 * Maps CaseRecord → SfdcCase (frontend type).
 */
function caseRecordToSfdcCase(cr: CaseRecord, sites: Map<string, Site>): SfdcCase {
  const site = sites.get(cr.siteId);
  return {
    caseNumber:         cr.caseNumber,
    siteId:             cr.siteId,
    siteLink:           cr.siteId,
    siteName:           cr.siteName || site?.siteName || '',
    siteStatus:         site?.siteStatus || '',
    lastIntervalEndDate: site?.lastIntervalEndDate || '',
    miProductSku:       site?.miProductSku || '',
    connectionType:     site?.connectionType || '',
    caseStatus:         (cr.status as SfdcCase['caseStatus']) || 'New',
    severity:           String(site?.severity ?? ''),
    caseCategory:       'Other' as SfdcCase['caseCategory'],
    caseType:           'MI. Drop Out' as SfdcCase['caseType'],
    caseOwner:          cr.owner,
    caseAge:            cr.caseAge,
    createdDate:        cr.createdDate,
    lastUpdate:         cr.modifiedDate,
    installerName:      site?.installerName || '',
    state:              site?.state || '',
  };
}

// ── BackendDataProvider ──────────────────────────────────────────────────────

export class BackendDataProvider implements DataProvider {
  private fleetCache: Site[] | null = null;
  private caseCache: SfdcCase[] | null = null;
  private cacheTs = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  private isCacheStale(): boolean {
    return Date.now() - this.cacheTs > this.CACHE_TTL_MS;
  }

  async getStatus(): Promise<DataSourceInfo> {
    try {
      const res  = await fetch('/api/data-quality/status');
      const json: ApiStatusResponse = await res.json();
      const info: DataSourceInfo = {
        status:          json.status as DataStatus,
        fleetSource:     json.fleetSource,
        caseSource:      json.caseSource,
        lastRefreshedAt: json.lastRefreshedAt,
      };
      return info;
    } catch {
      return { status: 'error', fleetSource: 'error', caseSource: 'error', lastRefreshedAt: null };
    }
  }

  async refresh(): Promise<void> {
    await fetch('/api/refresh', { method: 'POST' });
    this.fleetCache = null;
    this.caseCache  = null;
    this.cacheTs    = 0;
  }

  private async loadFleet(): Promise<{ sites: Site[]; error?: string }> {
    if (this.fleetCache && !this.isCacheStale()) return { sites: this.fleetCache };
    try {
      const res = await fetch('/api/fleet', { signal: AbortSignal.timeout(30_000) });
      const json: ApiFleetResponse = await res.json();

      if (!res.ok || json.status === 'error') {
        return { sites: [], error: json.error ?? `HTTP ${res.status}` };
      }

      const siteMap  = new Map<string, Site>();
      for (const fs of (json.sites as FleetSite[])) {
        siteMap.set(fs.siteId, fleetSiteToSite(fs));
      }
      this.fleetCache = Array.from(siteMap.values());
      this.cacheTs    = Date.now();
      return { sites: this.fleetCache };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { sites: [], error: msg };
    }
  }

  private async loadCases(sites: Map<string, Site>): Promise<{ cases: SfdcCase[]; status: string; error?: string; reason?: string }> {
    if (this.caseCache && !this.isCacheStale()) return { cases: this.caseCache, status: 'ok' };
    try {
      const res  = await fetch('/api/cases', { signal: AbortSignal.timeout(30_000) });
      const json: ApiCasesResponse = await res.json();

      if (json.status === 'unavailable') {
        return { cases: [], status: 'unavailable', reason: json.reason };
      }
      if (!res.ok || json.status === 'error') {
        return { cases: [], status: 'error', error: json.error ?? `HTTP ${res.status}` };
      }

      this.caseCache = (json.cases as CaseRecord[]).map(cr => caseRecordToSfdcCase(cr, sites));
      return { cases: this.caseCache, status: 'ok' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { cases: [], status: 'error', error: msg };
    }
  }

  async getSites(filters?: DashboardFilters): Promise<Site[]> {
    const { sites } = await this.loadFleet();
    return this.applyFilters(sites, filters);
  }

  async getSiteById(siteId: string): Promise<Site | null> {
    const { sites } = await this.loadFleet();
    return sites.find(s => s.siteId === siteId) ?? null;
  }

  async getCases(filters?: DashboardFilters): Promise<SfdcCase[]> {
    const { sites }      = await this.loadFleet();
    const siteMap        = new Map(sites.map(s => [s.siteId, s]));
    const { cases }      = await this.loadCases(siteMap);
    return this.applyCaseFilters(cases, filters);
  }

  async getCasesBySiteId(siteId: string): Promise<SfdcCase[]> {
    const { sites }      = await this.loadFleet();
    const siteMap        = new Map(sites.map(s => [s.siteId, s]));
    const { cases }      = await this.loadCases(siteMap);
    return cases.filter(c => c.siteId === siteId);
  }

  async getCaseByNumber(caseNumber: string): Promise<SfdcCase | null> {
    const { sites }      = await this.loadFleet();
    const siteMap        = new Map(sites.map(s => [s.siteId, s]));
    const { cases }      = await this.loadCases(siteMap);
    return cases.find(c => c.caseNumber === caseNumber) ?? null;
  }

  async getSeverityDistribution(filters?: DashboardFilters): Promise<SeverityDistribution[]> {
    const sites = await this.getSites(filters);
    return ([1, 2, 3, 4] as const).map(level => {
      const ls = sites.filter(s => s.severity === level);
      return {
        level: level as SeverityLevel,
        count: ls.length,
        percentage: sites.length > 0 ? Math.round((ls.length / sites.length) * 1000) / 10 : 0,
        subcategoryA: ls.filter(s => s.severitySubcategory === 'a').length,
        subcategoryB: ls.filter(s => s.severitySubcategory === 'b').length,
        subcategoryC: ls.filter(s => s.severitySubcategory === 'c').length,
      };
    });
  }

  async getHistoricalSeverity(_f?: DashboardFilters): Promise<HistoricalSeverity[]> {
    // Historical data is not available from the current Incorta insight.
    // The insight returns current-state rows only.
    // Return empty array — TrendsPage will detect this and display "unavailable".
    return [];
  }

  async getKpis(filters?: DashboardFilters): Promise<DashboardKpis> {
    const sites = await this.getSites(filters);
    const n     = sites.length;
    const s1    = sites.filter(s => s.severity === 1);
    const s2    = sites.filter(s => s.severity === 2);
    const s3    = sites.filter(s => s.severity === 3);
    const s4    = sites.filter(s => s.severity === 4);
    const s123  = s1.length + s2.length + s3.length;
    const pct   = (v: number) => n > 0 ? Math.round((v / n) * 1000) / 10 : 0;
    const oc    = sites.filter(s => s.hasOpenCase).length;
    const a     = [...s1, ...s2, ...s3].filter(s => s.severitySubcategory === 'a').length;
    const b     = [...s1, ...s2, ...s3].filter(s => s.severitySubcategory === 'b').length;
    const c     = [...s1, ...s2, ...s3].filter(s => s.severitySubcategory === 'c').length;
    return {
      totalSites:          { label: 'Total C&I Sites', value: n },
      pctSev123:           { label: '%Sites in Sev 1/2/3', value: `${pct(s123)}%` },
      countSev123:         { label: '#Sites in Sev 1/2/3', value: s123 },
      sev123a:             { label: '(a) NRP', value: a },
      sev123b:             { label: '(b) Prod/Meter Issue', value: b },
      sev123c:             { label: '(c) No Case Needed', value: c },
      pctSev4:             { label: '%Sites in Sev 4', value: `${pct(s4.length)}%` },
      countSev4:           { label: '#Sites in Sev 4', value: s4.length },
      pctSev1:             { label: '%Sites in Sev 1', value: `${pct(s1.length)}%` },
      pctSev2:             { label: '%Sites in Sev 2', value: `${pct(s2.length)}%` },
      pctSev3:             { label: '%Sites in Sev 3', value: `${pct(s3.length)}%` },
      sitesWithOpenCases:  { label: 'Sites with Open Cases', value: oc },
      sitesWithNoOpenCases:{ label: 'Sites without Open Cases', value: n - oc },
    };
  }

  async getFilterOptions(field: string): Promise<string[]> {
    const { sites } = await this.loadFleet();
    const unique = (fn: (s: Site) => string) => [...new Set(sites.map(fn))].filter(Boolean).sort();
    switch (field) {
      case 'microinverterType': return [...new Set(sites.map(s => s.microinverterType))].sort();
      case 'connectionType':    return unique(s => s.connectionType);
      case 'siteStage':         return unique(s => s.siteStage);
      case 'miProductSku':      return unique(s => s.miProductSku);
      case 'installerName':     return unique(s => s.installerName);
      case 'state':             return unique(s => s.state);
      default: return [];
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private applyFilters(sites: Site[], filters?: DashboardFilters): Site[] {
    if (!filters) return sites;
    let r = sites;
    if (filters.microinverterType?.length) r = r.filter(s => filters.microinverterType!.includes(s.microinverterType));
    if (filters.miProductSku?.length)      r = r.filter(s => filters.miProductSku!.includes(s.miProductSku));
    if (filters.severity?.length)          r = r.filter(s => filters.severity!.includes(s.severity));
    if (filters.siteStage?.length)         r = r.filter(s => filters.siteStage!.includes(s.siteStage));
    if (filters.connectionType?.length)    r = r.filter(s => filters.connectionType!.includes(s.connectionType));
    if (filters.searchTerm) {
      const t = filters.searchTerm.toLowerCase();
      r = r.filter(s =>
        s.siteName.toLowerCase().includes(t) ||
        s.siteId.toLowerCase().includes(t) ||
        s.installerName.toLowerCase().includes(t)
      );
    }
    return r;
  }

  private applyCaseFilters(cases: SfdcCase[], filters?: DashboardFilters): SfdcCase[] {
    if (!filters) return cases;
    let r = cases;
    if (filters.searchTerm) {
      const t = filters.searchTerm.toLowerCase();
      r = r.filter(c =>
        c.siteName.toLowerCase().includes(t) ||
        c.siteId.toLowerCase().includes(t) ||
        c.caseNumber.includes(t)
      );
    }
    return r;
  }
}
