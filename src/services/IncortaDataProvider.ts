import type { DataProvider } from './DataProvider';
import type {
  Site,
  SfdcCase,
  SeverityDistribution,
  HistoricalSeverity,
  DashboardFilters,
  DashboardKpis,
  SeverityLevel,
} from '../types';
import { computeHealthScore } from './FleetAnalytics';
import { classifyMicroinverterType } from '../utils/skuFamily';

/**
 * Column indices — C&I Severity & Cases insight (24 columns, 2134 sites).
 */
const C = {
  SITE_ID: 0, SITE_NAME: 1, STAGE: 2, STATUS: 3, STATUS_REASON: 4,
  LAST_INTERVAL: 5, MICRO_COUNT: 6, INV_PROCLOAD: 7, INV_PARAMTBL: 8,
  ENVOY_COUNT: 9, MI_SKU: 10, ENVOY_TYPES: 11, EMU_SW: 12,
  CONN_TYPE: 13, INSTALLER: 14, STATE: 15, COUNTRY: 16,
  CREATED_AT: 17, WEEK_NUM: 18, SEVERITY: 19,
  METER_ENERGY: 20, MICRO_ENERGY: 21, ENERGY_PER_MICRO: 22, DAYS_PRODUCING: 23,
} as const;

function parseSev(raw: string | null): SeverityLevel {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return (n >= 1 && n <= 4) ? n as 1 | 2 | 3 | 4 : null;
}

function parseStatus(raw: string): Site['siteStatus'] {
  const known: Site['siteStatus'][] = [
    'Normal', 'Production Issue', 'Microinverters Not Reporting',
    'Envoy Not Reporting', 'Meter Issue',
  ];
  return known.find(s => s === raw) ?? 'Normal';
}

function parseStage(raw: string): Site['siteStage'] {
  if (raw === 'Ready') return 'Ready';
  if (raw === 'Verifying') return 'Verifying';
  return 'Final';
}

function parseConn(raw: string): Site['connectionType'] {
  if (raw === 'Wifi') return 'Wifi';
  if (raw === 'Cellular') return 'Cellular';
  return 'Ethernet';
}

function deriveSub(sev: SeverityLevel, status: Site['siteStatus']): Site['severitySubcategory'] {
  if (sev === null) return null;
  if (status === 'Envoy Not Reporting' || status === 'Microinverters Not Reporting') return 'a';
  if (status === 'Production Issue' || status === 'Meter Issue') return 'b';
  return 'c';
}

function ts(raw: string | null): string {
  if (!raw) return '';
  try { return new Date(raw).toISOString().split('T')[0]; } catch { return ''; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any[];

export class IncortaDataProvider implements DataProvider {
  private dashId: string;
  private insId: string;
  private token: string;
  private cache: Site[] | null = null;

  constructor() {
    this.dashId = import.meta.env.VITE_INCORTA_DASHBOARD_ID ?? '';
    this.insId = import.meta.env.VITE_INCORTA_INSIGHT_ID ?? '';
    this.token = import.meta.env.VITE_INCORTA_PAT ?? '';
  }

  private async fetchRaw(): Promise<Row[]> {
    const url = `/api/incorta/dashboards/${this.dashId}/insights/${this.insId}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
      body: JSON.stringify({ pagination: { startRow: 0, pageSize: 100000 } }),
    });
    if (!res.ok) throw new Error(`Incorta ${res.status}`);
    const json = await res.json();
    return json.data ?? [];
  }

  private rowToSite(r: Row): Site {
    const sev = parseSev(String(r[C.SEVERITY] ?? ''));
    const status = parseStatus(r[C.STATUS] ?? '');
    const sub = deriveSub(sev, status);
    const envoyRaw = (r[C.ENVOY_TYPES] ?? '').replace(/^\||\|$/g, '').split('|')[0] || 'Unknown';

    const site: Site = {
      siteId: String(r[C.SITE_ID]),
      siteName: r[C.SITE_NAME] ?? '',
      siteStage: parseStage(r[C.STAGE] ?? ''),
      siteStatus: status,
      statusReason: r[C.STATUS_REASON] ?? '',
      lastIntervalEndDate: ts(r[C.LAST_INTERVAL]),
      microCount: r[C.MICRO_COUNT] ?? 0,
      envoyCount: r[C.ENVOY_COUNT] ?? 0,
      miProductSku: r[C.MI_SKU] ?? '',
      envoyType: envoyRaw as Site['envoyType'],
      installerName: r[C.INSTALLER] ?? '',
      state: r[C.STATE] ?? '',
      country: r[C.COUNTRY] ?? '',
      connectionType: parseConn(r[C.CONN_TYPE] ?? ''),
      severity: sev,
      severitySubcategory: sub,
      invProduced: r[C.INV_PROCLOAD] ?? '',
      invParamBld: r[C.INV_PARAMTBL] ?? '',
      hasOpenCase: sub === 'a' || sub === 'b',
      meterEnergy: r[C.METER_ENERGY] ?? 0,
      microEnergy: r[C.MICRO_ENERGY] ?? 0,
      energyPerMicroPerDay: r[C.ENERGY_PER_MICRO] ?? 0,
      daysProducing: r[C.DAYS_PRODUCING] ?? 0,
      siteCreatedAt: ts(r[C.CREATED_AT]),
      emuSwVersion: r[C.EMU_SW] ?? '',
      healthScore: 0,
      microinverterType: classifyMicroinverterType(String(r[C.MI_SKU] ?? '')),
    };
    site.healthScore = computeHealthScore(site);
    return site;
  }

  private async load(): Promise<Site[]> {
    if (this.cache) return this.cache;
    const rows = await this.fetchRaw();
    this.cache = rows.map(r => this.rowToSite(r));
    return this.cache;
  }

  async getSites(filters?: DashboardFilters): Promise<Site[]> {
    let result = await this.load();
    if (filters?.severity?.length)
      result = result.filter(s => filters.severity!.includes(s.severity));
    if (filters?.siteStage?.length)
      result = result.filter(s => filters.siteStage!.includes(s.siteStage));
    if (filters?.connectionType?.length)
      result = result.filter(s => filters.connectionType!.includes(s.connectionType));
    if (filters?.miProductSku?.length)
      result = result.filter(s => filters.miProductSku!.includes(s.miProductSku));
    if (filters?.searchTerm) {
      const t = filters.searchTerm.toLowerCase();
      result = result.filter(s =>
        s.siteName.toLowerCase().includes(t) ||
        s.siteId.toLowerCase().includes(t) ||
        s.installerName.toLowerCase().includes(t)
      );
    }
    return result;
  }

  async getSiteById(id: string): Promise<Site | null> {
    return (await this.load()).find(s => s.siteId === id) ?? null;
  }

  async getCases(_f?: DashboardFilters): Promise<SfdcCase[]> { return []; }
  async getCasesBySiteId(_id: string): Promise<SfdcCase[]> { return []; }
  async getCaseByNumber(_n: string): Promise<SfdcCase | null> { return null; }

  async getSeverityDistribution(filters?: DashboardFilters): Promise<SeverityDistribution[]> {
    const sites = await this.getSites(filters);
    const total = sites.length;
    return ([1, 2, 3, 4] as const).map(level => {
      const ls = sites.filter(s => s.severity === level);
      return {
        level: level as SeverityLevel,
        count: ls.length,
        percentage: total > 0 ? Math.round((ls.length / total) * 1000) / 10 : 0,
        subcategoryA: ls.filter(s => s.severitySubcategory === 'a').length,
        subcategoryB: ls.filter(s => s.severitySubcategory === 'b').length,
        subcategoryC: ls.filter(s => s.severitySubcategory === 'c').length,
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getHistoricalSeverity(_f?: DashboardFilters): Promise<HistoricalSeverity[]> { return []; }

  async getKpis(filters?: DashboardFilters): Promise<DashboardKpis> {
    const sites = await this.getSites(filters);
    const n = sites.length;
    const s1 = sites.filter(s => s.severity === 1);
    const s2 = sites.filter(s => s.severity === 2);
    const s3 = sites.filter(s => s.severity === 3);
    const s4 = sites.filter(s => s.severity === 4);
    const s123 = s1.length + s2.length + s3.length;
    const pct = (v: number) => n > 0 ? Math.round((v / n) * 1000) / 10 : 0;
    const oc = sites.filter(s => s.hasOpenCase).length;
    const a = [...s1, ...s2, ...s3].filter(s => s.severitySubcategory === 'a').length;
    const b = [...s1, ...s2, ...s3].filter(s => s.severitySubcategory === 'b').length;
    const c = [...s1, ...s2, ...s3].filter(s => s.severitySubcategory === 'c').length;

    return {
      totalSites: { label: 'Total C&I Sites', value: n },
      pctSev123: { label: '%Sites in Sev 1/2/3', value: `${pct(s123)}%` },
      countSev123: { label: '#Sites in Sev 1/2/3', value: s123 },
      sev123a: { label: '(a) Open, not In Progress', value: a },
      sev123b: { label: '(b) Open, In Progress', value: b },
      sev123c: { label: '(c) No open cases', value: c },
      pctSev4: { label: '%Sites in Sev 4', value: `${pct(s4.length)}%` },
      countSev4: { label: '#Sites in Sev 4', value: s4.length },
      pctSev1: { label: '%Sites in Sev 1', value: `${pct(s1.length)}%` },
      pctSev2: { label: '%Sites in Sev 2', value: `${pct(s2.length)}%` },
      pctSev3: { label: '%Sites in Sev 3', value: `${pct(s3.length)}%` },
      sitesWithOpenCases: { label: 'Sites with Open Cases', value: oc },
      sitesWithNoOpenCases: { label: 'Sites without Open Cases', value: n - oc },
    };
  }

  async getFilterOptions(field: string): Promise<string[]> {
    const sites = await this.load();
    const unique = (fn: (s: Site) => string) => [...new Set(sites.map(fn))].filter(Boolean).sort();
    switch (field) {
      case 'connectionType': return unique(s => s.connectionType);
      case 'siteStage': return unique(s => s.siteStage);
      case 'miProductSku': return unique(s => s.miProductSku);
      case 'installerName': return unique(s => s.installerName);
      case 'state': return unique(s => s.state);
      default: return [];
    }
  }
}
