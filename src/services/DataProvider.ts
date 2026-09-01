import type {
  Site,
  SfdcCase,
  SeverityDistribution,
  HistoricalSeverity,
  DashboardFilters,
  DashboardKpis,
} from '../types';

/**
 * Abstract DataProvider interface.
 *
 * All dashboard data access flows through this abstraction.
 * Concrete implementations:
 *   - MockDataProvider: uses local mock data for development/testing
 *   - Future APIDataProvider: connects to a backend REST/GraphQL API
 *   - Future IncortaDataProvider: direct Incorta integration (if needed)
 */
export interface DataProvider {
  /** Retrieve sites, optionally filtered */
  getSites(filters?: DashboardFilters): Promise<Site[]>;

  /** Retrieve a single site by ID */
  getSiteById(siteId: string): Promise<Site | null>;

  /** Retrieve cases, optionally filtered */
  getCases(filters?: DashboardFilters): Promise<SfdcCase[]>;

  /** Retrieve cases for a specific site */
  getCasesBySiteId(siteId: string): Promise<SfdcCase[]>;

  /** Retrieve a single case by case number */
  getCaseByNumber(caseNumber: string): Promise<SfdcCase | null>;

  /** Retrieve severity distribution */
  getSeverityDistribution(filters?: DashboardFilters): Promise<SeverityDistribution[]>;

  /** Retrieve historical severity data */
  getHistoricalSeverity(filters?: DashboardFilters): Promise<HistoricalSeverity[]>;

  /** Retrieve dashboard KPIs */
  getKpis(filters?: DashboardFilters): Promise<DashboardKpis>;

  /** Get distinct values for filter dropdowns */
  getFilterOptions(field: string): Promise<string[]>;
}
