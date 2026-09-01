import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../src/services/MockDataProvider';
import type { DataProvider } from '../src/services/DataProvider';

describe('MockDataProvider', () => {
  let provider: DataProvider;

  beforeEach(() => {
    provider = new MockDataProvider();
  });

  describe('getSites', () => {
    it('should return all 2060 sites when no filters applied', async () => {
      const sites = await provider.getSites();
      expect(sites.length).toBe(2060);
    });

    it('should filter sites by severity', async () => {
      const sites = await provider.getSites({ severity: [1] });
      expect(sites.length).toBe(139);
      expect(sites.every((s) => s.severity === 1)).toBe(true);
    });

    it('should filter sites by connection type', async () => {
      const sites = await provider.getSites({ connectionType: ['Ethernet'] });
      expect(sites.every((s) => s.connectionType === 'Ethernet')).toBe(true);
      expect(sites.length).toBeGreaterThan(0);
    });

    it('should filter sites by search term', async () => {
      const sites = await provider.getSites({ searchTerm: 'Derek' });
      expect(sites.length).toBeGreaterThan(0);
      expect(sites[0].siteName).toContain('Derek');
    });

    it('should return empty array for non-matching filters', async () => {
      const sites = await provider.getSites({ searchTerm: 'NonExistentSite12345' });
      expect(sites).toHaveLength(0);
    });
  });

  describe('getSiteById', () => {
    it('should return a site by ID', async () => {
      const allSites = await provider.getSites();
      const firstId = allSites[0].siteId;
      const site = await provider.getSiteById(firstId);
      expect(site).not.toBeNull();
      expect(site!.siteId).toBe(firstId);
    });

    it('should return null for non-existent site', async () => {
      const site = await provider.getSiteById('NONEXISTENT');
      expect(site).toBeNull();
    });
  });

  describe('getCases', () => {
    it('should return cases when no filters applied', async () => {
      const cases = await provider.getCases();
      expect(cases.length).toBeGreaterThan(0);
    });

    it('should have composite severity format', async () => {
      const cases = await provider.getCases();
      expect(cases[0].severity).toMatch(/^\d\([abc]\)$/);
    });

    it('should filter cases by search term', async () => {
      const cases = await provider.getCases();
      const firstSiteId = cases[0].siteId;
      const filtered = await provider.getCases({ searchTerm: firstSiteId });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((c) => c.siteId === firstSiteId)).toBe(true);
    });
  });

  describe('getCasesBySiteId', () => {
    it('should return cases for a site with open cases', async () => {
      const sites = await provider.getSites();
      const openCaseSite = sites.find((s) => s.hasOpenCase);
      expect(openCaseSite).toBeDefined();
      const cases = await provider.getCasesBySiteId(openCaseSite!.siteId);
      expect(cases.length).toBeGreaterThan(0);
      expect(cases.every((c) => c.siteId === openCaseSite!.siteId)).toBe(true);
    });
  });

  describe('getCaseByNumber', () => {
    it('should return a case by number', async () => {
      const allCases = await provider.getCases();
      const firstNumber = allCases[0].caseNumber;
      const sfdcCase = await provider.getCaseByNumber(firstNumber);
      expect(sfdcCase).not.toBeNull();
      expect(sfdcCase!.caseNumber).toBe(firstNumber);
    });

    it('should return null for non-existent case', async () => {
      const sfdcCase = await provider.getCaseByNumber('NONEXISTENT');
      expect(sfdcCase).toBeNull();
    });
  });

  describe('getSeverityDistribution', () => {
    it('should return distribution for severity levels 1-4', async () => {
      const distribution = await provider.getSeverityDistribution();
      expect(distribution).toHaveLength(4);
      expect(distribution.map((d) => d.level)).toEqual([1, 2, 3, 4]);
    });

    it('should include subcategory breakdowns', async () => {
      const distribution = await provider.getSeverityDistribution();
      const sev1 = distribution.find((d) => d.level === 1)!;
      expect(sev1.subcategoryA).toBe(13);
      expect(sev1.subcategoryB).toBe(121);
      expect(sev1.subcategoryC).toBe(5);
    });

    it('should match confirmed per-level counts', async () => {
      const dist = await provider.getSeverityDistribution();
      expect(dist.find((d) => d.level === 1)!.count).toBe(139);
      expect(dist.find((d) => d.level === 2)!.count).toBe(67);
      expect(dist.find((d) => d.level === 3)!.count).toBe(128);
      expect(dist.find((d) => d.level === 4)!.count).toBe(123);
    });

    it('should reconcile Sev 2 subcategory breakdown', async () => {
      const dist = await provider.getSeverityDistribution();
      const sev2 = dist.find((d) => d.level === 2)!;
      expect(sev2.subcategoryA).toBe(2);
      expect(sev2.subcategoryB).toBe(63);
      expect(sev2.subcategoryC).toBe(2);
      expect(sev2.subcategoryA + sev2.subcategoryB + sev2.subcategoryC).toBe(67);
    });

    it('should reconcile Sev 3 subcategory breakdown', async () => {
      const dist = await provider.getSeverityDistribution();
      const sev3 = dist.find((d) => d.level === 3)!;
      expect(sev3.subcategoryA).toBe(16);
      expect(sev3.subcategoryB).toBe(103);
      expect(sev3.subcategoryC).toBe(9);
      expect(sev3.subcategoryA + sev3.subcategoryB + sev3.subcategoryC).toBe(128);
    });

    it('should reconcile cross-level (a)/(b)/(c) totals', async () => {
      const dist = await provider.getSeverityDistribution();
      const sev123 = dist.filter((d) => d.level !== null && d.level !== 4);
      const totalA = sev123.reduce((sum, d) => sum + d.subcategoryA, 0);
      const totalB = sev123.reduce((sum, d) => sum + d.subcategoryB, 0);
      const totalC = sev123.reduce((sum, d) => sum + d.subcategoryC, 0);
      expect(totalA).toBe(31);
      expect(totalB).toBe(287);
      expect(totalC).toBe(16);
      expect(totalA + totalB + totalC).toBe(334);
    });
  });

  describe('getHistoricalSeverity', () => {
    it('should return historical severity data with correct fields', async () => {
      const history = await provider.getHistoricalSeverity();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('installer');
      expect(history[0]).toHaveProperty('sev1');
      expect(history[0]).toHaveProperty('sev2');
      expect(history[0]).toHaveProperty('sev3');
      expect(history[0]).toHaveProperty('total');
    });

    it('should not have sev4 or s0 fields', async () => {
      const history = await provider.getHistoricalSeverity();
      expect(history[0]).not.toHaveProperty('s0');
      expect(history[0]).not.toHaveProperty('sev4');
    });

    it('should have total = sev1 + sev2 + sev3 for every record', async () => {
      const history = await provider.getHistoricalSeverity();
      for (const row of history.slice(0, 100)) {
        expect(row.total).toBe(row.sev1 + row.sev2 + row.sev3);
      }
    });
  });

  describe('getKpis', () => {
    it('should return confirmed KPI values', async () => {
      const kpis = await provider.getKpis();
      expect(kpis.totalSites.value).toBe(2060);
      expect(kpis.countSev123.value).toBe(334);
      expect(kpis.sev123a.value).toBe(31);
      expect(kpis.sev123b.value).toBe(287);
      expect(kpis.sev123c.value).toBe(16);
      expect(kpis.countSev4.value).toBe(123);
    });

    it('should calculate confirmed percentage values', async () => {
      const kpis = await provider.getKpis();
      expect(kpis.pctSev123.value).toBe('16.2%');
      expect(kpis.pctSev4.value).toBe('6%');
      expect(kpis.pctSev1.value).toBe('6.7%');
      expect(kpis.pctSev2.value).toBe('3.3%');
      expect(kpis.pctSev3.value).toBe('6.2%');
    });

    it('should have all 13 KPI fields', async () => {
      const kpis = await provider.getKpis();
      const fields = [
        'totalSites', 'pctSev123', 'countSev123',
        'sev123a', 'sev123b', 'sev123c',
        'pctSev4', 'countSev4',
        'pctSev1', 'pctSev2', 'pctSev3',
        'sitesWithOpenCases', 'sitesWithNoOpenCases',
      ];
      for (const f of fields) {
        expect(kpis).toHaveProperty(f);
      }
    });
  });

  describe('confirmed business rules', () => {
    it('should have exactly 2060 total sites', async () => {
      const sites = await provider.getSites();
      expect(sites.length).toBe(2060);
    });

    it('should have 139 Sev-1, 67 Sev-2, 128 Sev-3, 123 Sev-4 sites', async () => {
      const sites = await provider.getSites();
      expect(sites.filter((s) => s.severity === 1).length).toBe(139);
      expect(sites.filter((s) => s.severity === 2).length).toBe(67);
      expect(sites.filter((s) => s.severity === 3).length).toBe(128);
      expect(sites.filter((s) => s.severity === 4).length).toBe(123);
    });

    it('should have 334 sites in Sev 1+2+3', async () => {
      const sites = await provider.getSites();
      const sev123 = sites.filter((s) => s.severity === 1 || s.severity === 2 || s.severity === 3);
      expect(sev123.length).toBe(334);
    });

    it('should have 457 total severity sites and 1603 no-severity sites', async () => {
      const sites = await provider.getSites();
      const withSev = sites.filter((s) => s.severity !== null);
      const noSev = sites.filter((s) => s.severity === null);
      expect(withSev.length).toBe(457);
      expect(noSev.length).toBe(1603);
    });

    it('should enforce confirmed site status enum values', async () => {
      const sites = await provider.getSites();
      const validStatuses = ['Normal', 'Production Issue', 'Microinverters Not Reporting', 'Envoy Not Reporting', 'Meter Issue'];
      for (const s of sites) {
        expect(validStatuses).toContain(s.siteStatus);
      }
    });

    it('should enforce confirmed case status enum values', async () => {
      const cases = await provider.getCases();
      const validStatuses = ['New', 'Case - In Progress'];
      for (const c of cases) {
        expect(validStatuses).toContain(c.caseStatus);
      }
    });

    it('should support array-based multi-value filtering', async () => {
      const sites = await provider.getSites({ connectionType: ['Ethernet', 'Wifi'] });
      expect(sites.length).toBeGreaterThan(0);
      for (const s of sites) {
        expect(['Ethernet', 'Wifi']).toContain(s.connectionType);
      }
    });

    it('should support severity array filter', async () => {
      const sites = await provider.getSites({ severity: [1, 2] });
      expect(sites.length).toBe(139 + 67);
      for (const s of sites) {
        expect([1, 2]).toContain(s.severity);
      }
    });

    it('should have composite severity format on all cases', async () => {
      const cases = await provider.getCases();
      for (const c of cases) {
        expect(c.severity).toMatch(/^\d\([abc]\)$/);
      }
    });
  });

  describe('getFilterOptions', () => {
    it('should return connection type options', async () => {
      const options = await provider.getFilterOptions('connectionType');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toEqual([...options].sort());
    });

    it('should return confirmed connection type values', async () => {
      const options = await provider.getFilterOptions('connectionType');
      expect(options).toContain('Ethernet');
      expect(options).toContain('Wifi');
      expect(options).toContain('Cellular');
    });

    it('should return SKU options', async () => {
      const options = await provider.getFilterOptions('miProductSku');
      expect(options.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown field', async () => {
      const options = await provider.getFilterOptions('unknownField');
      expect(options).toHaveLength(0);
    });
  });
});
