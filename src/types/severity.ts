import type { SeverityLevel } from './site';

export interface SeverityDistribution {
  level: SeverityLevel;
  count: number;
  percentage: number;
}

export interface HistoricalSeverity {
  date: string;
  s0: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
  noSeverity: number;
  total: number;
}
