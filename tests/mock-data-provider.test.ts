import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../src/services/MockDataProvider';
import type { DataProvider } from '../src/services/DataProvider';

describe('MockDataProvider', () => {
  let provider: DataProvider;

  beforeEach(() => {
    provider = new MockDataProvider();
  });

  describe('getSites', () => {
    it('should return all sites when no filters applied', async () => {
      const sites = await provider.getSites();
      expect(sites.length).toBeGreaterThan(0);
    });

    it('should filter sites by severity', async () => {
      const sites = await provider.getSites({ severity: ['S0'] });
      expect(sites.every((s) => s.severity === 'S0')).toBe(true);
    });

    it('should filter sites by site status', async () => {
      const sites = await provider.getSites({ siteStatus: ['Normal'] });
      expect(sites.every((s) => s.siteStatus === 'Normal')).toBe(true);
    });

    it('should filter sites by search term', async () => {
      const sites = await provider.getSites({ searchTerm: 'Portland' });
      expect(sites.length).toBe(1);
      expect(sites[0].siteName).toContain('Portland');
    });

    it('should return empty array for non-matching filters', async () => {
      const sites = await provider.getSites({ searchTerm: 'NonExistentSite12345' });
      expect(sites).toHaveLength(0);
    });
  });

  describe('getSiteById', () => {
    it('should return a site by ID', async () => {
      const site = await provider.getSiteById('SITE-001');
      expect(site).not.toBeNull();
      expect(site!.siteId).toBe('SITE-001');
    });

    it('should return null for non-existent site', async () => {
      const site = await provider.getSiteById('NONEXISTENT');
      expect(site).toBeNull();
    });
  });

  describe('getCases', () => {
    it('should return all cases when no filters applied', async () => {
      const cases = await provider.getCases();
      expect(cases.length).toBeGreaterThan(0);
    });

    it('should filter cases by status', async () => {
      const cases = await provider.getCases({ caseStatus: ['Open'] });
      expect(cases.every((c) => c.caseStatus === 'Open')).toBe(true);
    });

    it('should filter cases by category', async () => {
      const cases = await provider.getCases({ caseCategory: ['Communication'] });
      expect(cases.every((c) => c.caseCategory === 'Communication')).toBe(true);
    });
  });

  describe('getCasesBySiteId', () => {
    it('should return cases for a specific site', async () => {
      const cases = await provider.getCasesBySiteId('SITE-003');
      expect(cases.length).toBeGreaterThan(0);
      expect(cases.every((c) => c.siteId === 'SITE-003')).toBe(true);
    });
  });

  describe('getCaseByNumber', () => {
    it('should return a case by number', async () => {
      const sfdcCase = await provider.getCaseByNumber('CS-100001');
      expect(sfdcCase).not.toBeNull();
      expect(sfdcCase!.caseNumber).toBe('CS-100001');
    });

    it('should return null for non-existent case', async () => {
      const sfdcCase = await provider.getCaseByNumber('NONEXISTENT');
      expect(sfdcCase).toBeNull();
    });
  });

  describe('getSeverityDistribution', () => {
    it('should return severity distribution', async () => {
      const distribution = await provider.getSeverityDistribution();
      expect(distribution.length).toBeGreaterThan(0);
      const totalPercentage = distribution.reduce((sum, d) => sum + d.percentage, 0);
      expect(totalPercentage).toBeGreaterThanOrEqual(95);
      expect(totalPercentage).toBeLessThanOrEqual(105);
    });
  });

  describe('getHistoricalSeverity', () => {
    it('should return historical severity data', async () => {
      const history = await provider.getHistoricalSeverity();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('s0');
      expect(history[0]).toHaveProperty('total');
    });
  });

  describe('getKpis', () => {
    it('should return dashboard KPIs', async () => {
      const kpis = await provider.getKpis();
      expect(kpis.totalSites.value).toBeGreaterThan(0);
      expect(kpis.totalOpenCases).toBeDefined();
      expect(kpis.criticalSeverity).toBeDefined();
      expect(kpis.sitesWithOpenCases).toBeDefined();
      expect(kpis.sitesWithNoOpenCases).toBeDefined();
      expect(kpis.averageCaseAge).toBeDefined();
    });
  });

  describe('getFilterOptions', () => {
    it('should return state options', async () => {
      const states = await provider.getFilterOptions('state');
      expect(states.length).toBeGreaterThan(0);
      expect(states).toEqual([...states].sort());
    });

    it('should return empty array for unknown field', async () => {
      const options = await provider.getFilterOptions('unknownField');
      expect(options).toHaveLength(0);
    });
  });
});
