export interface KpiMetric {
  label: string;
  value: number | string;
  unit?: string;
  description?: string;
}

export interface DashboardKpis {
  totalSites: KpiMetric;
  pctSev123: KpiMetric;
  countSev123: KpiMetric;
  sev123a: KpiMetric;
  sev123b: KpiMetric;
  sev123c: KpiMetric;
  pctSev4: KpiMetric;
  countSev4: KpiMetric;
  pctSev1: KpiMetric;
  pctSev2: KpiMetric;
  pctSev3: KpiMetric;
  sitesWithOpenCases: KpiMetric;
  sitesWithNoOpenCases: KpiMetric;
}
