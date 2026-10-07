import type { SeverityLevel, SiteStage, ConnectionType, MicroinverterType } from './site';

export interface DashboardFilters {
  microinverterType?: MicroinverterType[];
  miProductSku?: string[];
  severity?: SeverityLevel[];
  siteStage?: SiteStage[];
  connectionType?: ConnectionType[];
  searchTerm?: string;
}
