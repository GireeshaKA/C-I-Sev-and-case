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
import { mockSites } from '../../mock-data/sites';
import { mockCases } from '../../mock-data/cases';
import { mockHistoricalSeverity } from '../../mock-data/historical-severity';

/**
 * MockDataProvider — provides mock data for development and testing.
 * Implements the DataProvider interface using local static data.
 */
export class MockDataProvider implements DataProvider {
  private sites: Site[] = mockSites;
  private cases: SfdcCase[] = mockCases;
  private historicalSeverity: HistoricalSeverity[] = mockHistoricalSeverity;

  async getSites(filters?: DashboardFilters): Promise<Site[]> {
    let result = [...this.sites];

    if (filters?.severity?.length) {
      result = result.filter((s) => filters.severity!.includes(s.severity));
    }
    if (filters?.siteStatus?.length) {
      result = result.filter((s) => filters.siteStatus!.includes(s.siteStatus));
    }
    if (filters?.siteStage?.length) {
      result = result.filter((s) => filters.siteStage!.includes(s.siteStage));
    }
    if (filters?.connectionType?.length) {
      result = result.filter((s) => filters.connectionType!.includes(s.connectionType));
    }
    if (filters?.envoyType?.length) {
      result = result.filter((s) => filters.envoyType!.includes(s.envoyType));
    }
    if (filters?.state?.length) {
      result = result.filter((s) => filters.state!.includes(s.state));
    }
    if (filters?.country?.length) {
      result = result.filter((s) => filters.country!.includes(s.country));
    }
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.siteName.toLowerCase().includes(term) ||
          s.siteId.toLowerCase().includes(term) ||
          s.installerName.toLowerCase().includes(term)
      );
    }

    return result;
  }

  async getSiteById(siteId: string): Promise<Site | null> {
    return this.sites.find((s) => s.siteId === siteId) ?? null;
  }

  async getCases(filters?: DashboardFilters): Promise<SfdcCase[]> {
    let result = [...this.cases];

    if (filters?.caseStatus?.length) {
      result = result.filter((c) => filters.caseStatus!.includes(c.caseStatus));
    }
    if (filters?.caseCategory?.length) {
      result = result.filter((c) => filters.caseCategory!.includes(c.caseCategory));
    }
    if (filters?.caseType?.length) {
      result = result.filter((c) => filters.caseType!.includes(c.caseType));
    }
    if (filters?.severity?.length) {
      result = result.filter((c) => filters.severity!.includes(c.severity as SeverityLevel));
    }

    return result;
  }

  async getCasesBySiteId(siteId: string): Promise<SfdcCase[]> {
    return this.cases.filter((c) => c.siteId === siteId);
  }

  async getCaseByNumber(caseNumber: string): Promise<SfdcCase | null> {
    return this.cases.find((c) => c.caseNumber === caseNumber) ?? null;
  }

  async getSeverityDistribution(_filters?: DashboardFilters): Promise<SeverityDistribution[]> {
    const counts: Record<string, number> = {};
    const sites = await this.getSites(_filters);

    for (const site of sites) {
      counts[site.severity] = (counts[site.severity] || 0) + 1;
    }

    const total = sites.length;
    return Object.entries(counts).map(([level, count]) => ({
      level: level as SeverityLevel,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getHistoricalSeverity(_filters?: DashboardFilters): Promise<HistoricalSeverity[]> {
    return [...this.historicalSeverity];
  }

  async getKpis(_filters?: DashboardFilters): Promise<DashboardKpis> {
    const sites = await this.getSites(_filters);
    const cases = await this.getCases(_filters);
    const openCases = cases.filter((c) => c.caseStatus !== 'Closed');
    const siteIdsWithOpenCases = new Set(openCases.map((c) => c.siteId));
    const criticalCases = openCases.filter((c) => c.severity === 'S0' || c.severity === 'S1');
    const avgAge = openCases.length > 0
      ? Math.round(openCases.reduce((sum, c) => sum + c.age, 0) / openCases.length)
      : 0;

    return {
      totalSites: { label: 'Total Sites', value: sites.length },
      totalOpenCases: { label: 'Open Cases', value: openCases.length },
      criticalSeverity: { label: 'Critical (S0/S1)', value: criticalCases.length },
      sitesWithOpenCases: { label: 'Sites with Open Cases', value: siteIdsWithOpenCases.size },
      sitesWithNoOpenCases: { label: 'Sites without Open Cases', value: sites.length - siteIdsWithOpenCases.size },
      averageCaseAge: { label: 'Avg Case Age (days)', value: avgAge, unit: 'days' },
    };
  }

  async getFilterOptions(field: string): Promise<string[]> {
    switch (field) {
      case 'state':
        return [...new Set(this.sites.map((s) => s.state))].sort();
      case 'country':
        return [...new Set(this.sites.map((s) => s.country))].sort();
      case 'installerName':
        return [...new Set(this.sites.map((s) => s.installerName))].sort();
      case 'miProductSku':
        return [...new Set(this.sites.map((s) => s.miProductSku))].sort();
      default:
        return [];
    }
  }
}
