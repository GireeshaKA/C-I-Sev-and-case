import type { SeverityLevel } from './site';

export interface SeverityDistribution {
  level: SeverityLevel;
  count: number;
  percentage: number;
  subcategoryA: number;
  subcategoryB: number;
  subcategoryC: number;
}

export interface HistoricalSeverity {
  date: string;
  installer: string;
  sev1: number;
  sev2: number;
  sev3: number;
  total: number;
}
