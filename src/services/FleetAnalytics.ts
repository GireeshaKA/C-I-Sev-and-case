/**
 * FleetAnalytics — derived analytics computed from raw Site[] data.
 * Powers the next-gen Fleet Health Intelligence Platform.
 */
import type { Site, MicroinverterType } from '../types';
import { classifyMicroinverterType, MICROINVERTER_TYPE_COLORS } from '../utils/skuFamily';

/* ---- Health Score (0-100) ---- */
export function computeHealthScore(site: Site): number {
  let score = 100;
  // Severity penalty: 1=Critical(-40), 2=High(-25), 3=Medium(-15), 4=Low(-5)
  if (site.severity === 1) score -= 40;
  else if (site.severity === 2) score -= 25;
  else if (site.severity === 3) score -= 15;
  else if (site.severity === 4) score -= 5;
  // Status penalty
  if (site.siteStatus === 'Envoy Not Reporting') score -= 30;
  else if (site.siteStatus === 'Microinverters Not Reporting') score -= 25;
  else if (site.siteStatus === 'Production Issue') score -= 15;
  else if (site.siteStatus === 'Meter Issue') score -= 10;
  // Energy production penalty — low energy per micro per day
  if (site.energyPerMicroPerDay < 100 && site.daysProducing > 0) score -= 10;
  else if (site.energyPerMicroPerDay < 500 && site.daysProducing > 0) score -= 5;
  return Math.max(0, Math.min(100, score));
}

export function healthGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function healthColor(score: number): string {
  if (score >= 90) return '#10B981';  // Emerald — Healthy
  if (score >= 75) return '#0EA5E9';  // Sky Blue — Good
  if (score >= 60) return '#E89B0C';  // Amber — Moderate
  if (score >= 40) return '#F37421';  // Enphase Orange — Warning
  return '#E01B1B';                    // Red — Critical
}

/* ---- Installer Performance ---- */
export interface InstallerMetrics {
  name: string;
  siteCount: number;
  avgHealthScore: number;
  sevDistribution: Record<string, number>;
  criticalPct: number;  // % sev 1+2
  normalPct: number;    // % Normal status
  avgEnergyPerMicro: number;
  riskScore: number;    // 0-100 inverted health
}

export function computeInstallerMetrics(sites: Site[]): InstallerMetrics[] {
  const groups: Record<string, Site[]> = {};
  sites.forEach(s => {
    const name = s.installerName || 'Unknown';
    (groups[name] ??= []).push(s);
  });

  return Object.entries(groups)
    .map(([name, siteList]) => {
      const n = siteList.length;
      const avgHealth = siteList.reduce((sum, s) => sum + s.healthScore, 0) / n;
      const sevDist: Record<string, number> = {};
      siteList.forEach(s => {
        const k = s.severity ? `Sev ${s.severity}` : 'No Sev';
        sevDist[k] = (sevDist[k] || 0) + 1;
      });
      const critical = siteList.filter(s => s.severity === 1 || s.severity === 2).length;
      const normal = siteList.filter(s => s.siteStatus === 'Normal').length;
      const producing = siteList.filter(s => s.energyPerMicroPerDay > 0);
      const avgEnergy = producing.length > 0
        ? producing.reduce((sum, s) => sum + s.energyPerMicroPerDay, 0) / producing.length
        : 0;

      return {
        name,
        siteCount: n,
        avgHealthScore: Math.round(avgHealth * 10) / 10,
        sevDistribution: sevDist,
        criticalPct: Math.round((critical / n) * 1000) / 10,
        normalPct: Math.round((normal / n) * 1000) / 10,
        avgEnergyPerMicro: Math.round(avgEnergy * 10) / 10,
        riskScore: Math.round((100 - avgHealth) * 10) / 10,
      };
    })
    .sort((a, b) => b.siteCount - a.siteCount);
}

/* ---- SKU Reliability ---- */
export interface SkuMetrics {
  sku: string;
  microinverterType: MicroinverterType;
  siteCount: number;
  microinverterCount: number;  // SUM(microCount) across all sites with this SKU
  avgHealthScore: number;
  criticalPct: number;
  notReportingPct: number;
  avgEnergyPerMicro: number;
  sevCounts: Record<number, number>;
}

export function computeSkuMetrics(sites: Site[]): SkuMetrics[] {
  const groups: Record<string, Site[]> = {};
  sites.forEach(s => { (groups[s.miProductSku || 'UNKNOWN_SKU'] ??= []).push(s); });

  return Object.entries(groups)
    .map(([sku, siteList]) => {
      const n = siteList.length;
      const avgHealth = siteList.reduce((sum, s) => sum + s.healthScore, 0) / n;
      const critical = siteList.filter(s => s.severity === 1 || s.severity === 2).length;
      const notReporting = siteList.filter(s =>
        s.siteStatus === 'Envoy Not Reporting' || s.siteStatus === 'Microinverters Not Reporting'
      ).length;
      const producing = siteList.filter(s => s.energyPerMicroPerDay > 0);
      const avgEnergy = producing.length > 0
        ? producing.reduce((sum, s) => sum + s.energyPerMicroPerDay, 0) / producing.length
        : 0;
      const sevCounts: Record<number, number> = {};
      siteList.forEach(s => {
        if (s.severity) sevCounts[s.severity] = (sevCounts[s.severity] || 0) + 1;
      });

      return {
        sku,
        microinverterType: classifyMicroinverterType(sku),
        siteCount: n,
        microinverterCount: siteList.reduce((sum, s) => sum + s.microCount, 0),
        avgHealthScore: Math.round(avgHealth * 10) / 10,
        criticalPct: Math.round((critical / n) * 1000) / 10,
        notReportingPct: Math.round((notReporting / n) * 1000) / 10,
        avgEnergyPerMicro: Math.round(avgEnergy * 10) / 10,
        sevCounts,
      };
    })
    .sort((a, b) => b.siteCount - a.siteCount);
}

/* ---- Microinverter Type Metrics ---- */
export interface MicroinverterTypeMetrics {
  type: MicroinverterType;
  color: string;
  siteCount: number;
  microinverterCount: number;
  pctOfFleetSites: number;      // % of total sites
  pctOfFleetMicros: number;     // % of total microinverters
  sev1: number;
  sev2: number;
  sev3: number;
  sev4: number;
  nrpCount: number;
  avgHealthScore: number;
  skus: string[];               // distinct SKUs for this type
}

/**
 * Compute per-type (IQ8/IQ9/OTHER/UNKNOWN) aggregated metrics.
 * Site Count = COUNT DISTINCT site_id for that type.
 * Microinverter Count = SUM(microCount) for sites of that type.
 */
export function computeTypeMetrics(sites: Site[]): MicroinverterTypeMetrics[] {
  const ORDER: MicroinverterType[] = ['IQ8', 'IQ9', 'OTHER', 'UNKNOWN'];
  const groups: Record<MicroinverterType, Site[]> = { IQ8: [], IQ9: [], OTHER: [], UNKNOWN: [] };
  sites.forEach(s => groups[s.microinverterType].push(s));

  const totalSites  = sites.length;
  const totalMicros = sites.reduce((sum, s) => sum + s.microCount, 0);

  return ORDER
    .filter(t => groups[t].length > 0)
    .map(type => {
      const sl = groups[type];
      const n  = sl.length;
      const micros = sl.reduce((sum, s) => sum + s.microCount, 0);
      const avgH   = n > 0 ? sl.reduce((sum, s) => sum + s.healthScore, 0) / n : 0;

      return {
        type,
        color:               MICROINVERTER_TYPE_COLORS[type],
        siteCount:           n,
        microinverterCount:  micros,
        pctOfFleetSites:     totalSites  > 0 ? Math.round((n      / totalSites)  * 1000) / 10 : 0,
        pctOfFleetMicros:    totalMicros > 0 ? Math.round((micros / totalMicros) * 1000) / 10 : 0,
        sev1:      sl.filter(s => s.severity === 1).length,
        sev2:      sl.filter(s => s.severity === 2).length,
        sev3:      sl.filter(s => s.severity === 3).length,
        sev4:      sl.filter(s => s.severity === 4).length,
        nrpCount:  sl.filter(s => s.siteStatus === 'Envoy Not Reporting' || s.siteStatus === 'Microinverters Not Reporting').length,
        avgHealthScore: Math.round(avgH * 10) / 10,
        skus: [...new Set(sl.map(s => s.miProductSku).filter(Boolean))].sort(),
      };
    });
}

/* ---- Severity Trend (by fleet age week) ---- */
export interface SeverityTrendPoint {
  weekLabel: string;
  sev1: number;
  sev2: number;
  sev3: number;
  sev4: number;
  noSev: number;
  total: number;
}

export function computeSeverityByWeek(sites: Site[]): SeverityTrendPoint[] {
  const now = new Date();
  const weekBuckets: Record<string, Site[]> = {};

  sites.forEach(s => {
    if (!s.siteCreatedAt) return;
    const created = new Date(s.siteCreatedAt);
    const weeksAgo = Math.floor((now.getTime() - created.getTime()) / (7 * 86400000));
    const bucket = weeksAgo <= 4 ? '0-4w' : weeksAgo <= 12 ? '1-3m' : weeksAgo <= 26 ? '3-6m' : weeksAgo <= 52 ? '6-12m' : '12m+';
    (weekBuckets[bucket] ??= []).push(s);
  });

  const order = ['12m+', '6-12m', '3-6m', '1-3m', '0-4w'];
  return order.filter(k => weekBuckets[k]).map(weekLabel => {
    const bucket = weekBuckets[weekLabel] || [];
    return {
      weekLabel,
      sev1: bucket.filter(s => s.severity === 1).length,
      sev2: bucket.filter(s => s.severity === 2).length,
      sev3: bucket.filter(s => s.severity === 3).length,
      sev4: bucket.filter(s => s.severity === 4).length,
      noSev: bucket.filter(s => s.severity === null).length,
      total: bucket.length,
    };
  });
}

/* ---- Geographic Distribution ---- */
export interface GeoMetrics {
  state: string;
  siteCount: number;
  avgHealthScore: number;
  criticalCount: number;
}

export function computeGeoMetrics(sites: Site[]): GeoMetrics[] {
  const groups: Record<string, Site[]> = {};
  sites.forEach(s => { (groups[s.state || 'Unknown'] ??= []).push(s); });

  return Object.entries(groups)
    .map(([state, siteList]) => ({
      state,
      siteCount: siteList.length,
      avgHealthScore: Math.round(siteList.reduce((sum, s) => sum + s.healthScore, 0) / siteList.length * 10) / 10,
      criticalCount: siteList.filter(s => s.severity === 1 || s.severity === 2).length,
    }))
    .sort((a, b) => b.siteCount - a.siteCount);
}

/* ---- Risk Forecast ---- */
export interface RiskBucket {
  label: string;
  color: string;
  count: number;
  pct: number;
  sites: Site[];
}

export function computeRiskDistribution(sites: Site[]): RiskBucket[] {
  const buckets: RiskBucket[] = [
    { label: 'Critical Risk', color: '#E01B1B', count: 0, pct: 0, sites: [] },
    { label: 'High Risk', color: '#F37421', count: 0, pct: 0, sites: [] },
    { label: 'Moderate Risk', color: '#E89B0C', count: 0, pct: 0, sites: [] },
    { label: 'Low Risk', color: '#0EA5E9', count: 0, pct: 0, sites: [] },
    { label: 'Healthy', color: '#10B981', count: 0, pct: 0, sites: [] },
  ];

  sites.forEach(s => {
    const score = s.healthScore;
    if (score < 40) buckets[0].sites.push(s);
    else if (score < 60) buckets[1].sites.push(s);
    else if (score < 75) buckets[2].sites.push(s);
    else if (score < 90) buckets[3].sites.push(s);
    else buckets[4].sites.push(s);
  });

  const total = sites.length;
  buckets.forEach(b => {
    b.count = b.sites.length;
    b.pct = total > 0 ? Math.round((b.count / total) * 1000) / 10 : 0;
  });

  return buckets;
}

/* ---- Fleet Summary KPIs ---- */
export interface FleetKpis {
  totalSites: number;
  avgHealthScore: number;
  fleetGrade: string;
  criticalSites: number;
  notReportingSites: number;
  normalSites: number;
  sevDistribution: Record<string, number>;
  totalMicros: number;
  totalEnvoys: number;
  avgEnergyPerMicro: number;
  topRiskInstaller: string;
  topRiskSku: string;
}

export function computeFleetKpis(sites: Site[]): FleetKpis {
  const n = sites.length;
  const avgHealth = n > 0 ? sites.reduce((sum, s) => sum + s.healthScore, 0) / n : 0;
  const sevDist: Record<string, number> = { 'Sev 1': 0, 'Sev 2': 0, 'Sev 3': 0, 'Sev 4': 0, 'No Sev': 0 };
  sites.forEach(s => {
    if (s.severity) sevDist[`Sev ${s.severity}`]++;
    else sevDist['No Sev']++;
  });

  const producing = sites.filter(s => s.energyPerMicroPerDay > 0);
  const avgEnergy = producing.length > 0
    ? producing.reduce((sum, s) => sum + s.energyPerMicroPerDay, 0) / producing.length
    : 0;

  const installers = computeInstallerMetrics(sites).filter(i => i.siteCount >= 5);
  const skus = computeSkuMetrics(sites);
  const topRiskInstaller = installers.sort((a, b) => b.riskScore - a.riskScore)[0]?.name || 'N/A';
  const topRiskSku = skus.sort((a, b) => a.avgHealthScore - b.avgHealthScore)[0]?.sku || 'N/A';

  return {
    totalSites: n,
    avgHealthScore: Math.round(avgHealth * 10) / 10,
    fleetGrade: healthGrade(avgHealth),
    criticalSites: sites.filter(s => s.severity === 1 || s.severity === 2).length,
    notReportingSites: sites.filter(s => s.siteStatus.includes('Not Reporting')).length,
    normalSites: sites.filter(s => s.siteStatus === 'Normal').length,
    sevDistribution: sevDist,
    totalMicros: sites.reduce((sum, s) => sum + s.microCount, 0),
    totalEnvoys: sites.reduce((sum, s) => sum + s.envoyCount, 0),
    avgEnergyPerMicro: Math.round(avgEnergy * 10) / 10,
    topRiskInstaller,
    topRiskSku,
  };
}
