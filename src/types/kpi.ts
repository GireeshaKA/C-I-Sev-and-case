export interface KpiMetric {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: number;
  description?: string;
}

export interface DashboardKpis {
  totalSites: KpiMetric;
  totalOpenCases: KpiMetric;
  criticalSeverity: KpiMetric;
  sitesWithOpenCases: KpiMetric;
  sitesWithNoOpenCases: KpiMetric;
  averageCaseAge: KpiMetric;
}
