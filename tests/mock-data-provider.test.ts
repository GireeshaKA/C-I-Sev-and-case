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
  });

  describe('getKpis', () => {
    it('should return Phase 1 confirmed KPIs', async () => {
      const kpis = await provider.getKpis();
      expect(kpis.totalSites.value).toBe(2060);
      expect(kpis.countSev123).toBeDefined();
      expect(kpis.pctSev123).toBeDefined();
      expect(kpis.sev123a).toBeDefined();
      expect(kpis.sev123b).toBeDefined();
      expect(kpis.sev123c).toBeDefined();
      expect(kpis.pctSev4).toBeDefined();
      expect(kpis.countSev4).toBeDefined();
      expect(kpis.sitesWithOpenCases).toBeDefined();
      expect(kpis.sitesWithNoOpenCases).toBeDefined();
    });
  });

  describe('getFilterOptions', () => {
    it('should return connection type options', async () => {
      const options = await provider.getFilterOptions('connectionType');
      expect(options.length).toBeGreaterThan(0);
      expect(options).toEqual([...options].sort());
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
