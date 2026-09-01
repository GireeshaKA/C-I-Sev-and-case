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
    if (filters?.siteStage?.length) {
      result = result.filter((s) => filters.siteStage!.includes(s.siteStage));
    }
    if (filters?.connectionType?.length) {
      result = result.filter((s) => filters.connectionType!.includes(s.connectionType));
    }
    if (filters?.miProductSku?.length) {
      result = result.filter((s) => filters.miProductSku!.includes(s.miProductSku));
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

    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.siteName.toLowerCase().includes(term) ||
          c.siteId.toLowerCase().includes(term) ||
          c.caseNumber.toLowerCase().includes(term)
      );
    }
    if (filters?.connectionType?.length) {
      result = result.filter((c) => filters.connectionType!.includes(c.connectionType as Site['connectionType']));
    }
    if (filters?.miProductSku?.length) {
      result = result.filter((c) => filters.miProductSku!.includes(c.miProductSku));
    }

    return result;
  }

  async getCasesBySiteId(siteId: string): Promise<SfdcCase[]> {
    return this.cases.filter((c) => c.siteId === siteId);
  }

  async getCaseByNumber(caseNumber: string): Promise<SfdcCase | null> {
    return this.cases.find((c) => c.caseNumber === caseNumber) ?? null;
  }

  async getSeverityDistribution(filters?: DashboardFilters): Promise<SeverityDistribution[]> {
    const sites = await this.getSites(filters);
    const levels: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
    const total = sites.length;

    return levels.map((level) => {
      const levelSites = sites.filter((s) => s.severity === level);
      return {
        level: level as SeverityLevel,
        count: levelSites.length,
        percentage: total > 0 ? Math.round((levelSites.length / total) * 1000) / 10 : 0,
        subcategoryA: levelSites.filter((s) => s.severitySubcategory === 'a').length,
        subcategoryB: levelSites.filter((s) => s.severitySubcategory === 'b').length,
        subcategoryC: levelSites.filter((s) => s.severitySubcategory === 'c').length,
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getHistoricalSeverity(_filters?: DashboardFilters): Promise<HistoricalSeverity[]> {
    return [...this.historicalSeverity];
  }

  async getKpis(filters?: DashboardFilters): Promise<DashboardKpis> {
    const sites = await this.getSites(filters);
    const total = sites.length;
    const sev1 = sites.filter((s) => s.severity === 1);
    const sev2 = sites.filter((s) => s.severity === 2);
    const sev3 = sites.filter((s) => s.severity === 3);
    const sev4 = sites.filter((s) => s.severity === 4);
    const sev123 = sev1.length + sev2.length + sev3.length;
    const sev123a = [...sev1, ...sev2, ...sev3].filter((s) => s.severitySubcategory === 'a').length;
    const sev123b = [...sev1, ...sev2, ...sev3].filter((s) => s.severitySubcategory === 'b').length;
    const sev123c = [...sev1, ...sev2, ...sev3].filter((s) => s.severitySubcategory === 'c').length;
    const openCaseSites = sites.filter((s) => s.hasOpenCase).length;

    const pct = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

    return {
      totalSites: { label: 'Total C&I Sites', value: total },
      pctSev123: { label: '%Sites in Sev 1/2/3', value: `${pct(sev123)}%` },
      countSev123: { label: '#Sites in Sev 1/2/3', value: sev123 },
      sev123a: { label: '(a) Open, not In Progress', value: sev123a },
      sev123b: { label: '(b) Open, In Progress', value: sev123b },
      sev123c: { label: '(c) No open cases', value: sev123c },
      pctSev4: { label: '%Sites in Sev 4', value: `${pct(sev4.length)}%` },
      countSev4: { label: '#Sites in Sev 4', value: sev4.length },
      pctSev1: { label: '%Sites in Sev 1', value: `${pct(sev1.length)}%` },
      pctSev2: { label: '%Sites in Sev 2', value: `${pct(sev2.length)}%` },
      pctSev3: { label: '%Sites in Sev 3', value: `${pct(sev3.length)}%` },
      sitesWithOpenCases: { label: 'Sites with Open Cases', value: openCaseSites },
      sitesWithNoOpenCases: { label: 'Sites without Open Cases', value: total - openCaseSites },
    };
  }

  async getFilterOptions(field: string): Promise<string[]> {
    switch (field) {
      case 'connectionType':
        return [...new Set(this.sites.map((s) => s.connectionType))].sort();
      case 'siteStage':
        return [...new Set(this.sites.map((s) => s.siteStage))].sort();
      case 'miProductSku':
        return [...new Set(this.sites.map((s) => s.miProductSku))].sort();
      case 'installerName':
        return [...new Set(this.sites.map((s) => s.installerName))].sort();
      case 'state':
        return [...new Set(this.sites.map((s) => s.state))].sort();
      default:
        return [];
    }
  }
}
