import type { SeverityLevel, SiteStage, SiteStatus, ConnectionType, EnvoyType } from './site';
import type { CaseStatus, CaseCategory, CaseType } from './case';

export interface DashboardFilters {
  severity?: SeverityLevel[];
  siteStage?: SiteStage[];
  siteStatus?: SiteStatus[];
  connectionType?: ConnectionType[];
  envoyType?: EnvoyType[];
  caseStatus?: CaseStatus[];
  caseCategory?: CaseCategory[];
  caseType?: CaseType[];
  installerName?: string[];
  state?: string[];
  country?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}
