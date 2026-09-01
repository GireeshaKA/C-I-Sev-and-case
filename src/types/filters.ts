import type { SeverityLevel, SiteStage, ConnectionType } from './site';

export interface DashboardFilters {
  severity?: SeverityLevel[];
  siteStage?: SiteStage[];
  connectionType?: ConnectionType[];
  miProductSku?: string[];
  searchTerm?: string;
}
