/**
 * Microinverter Type Intelligence — unit tests
 *
 * Covers:
 *   1. classifyMicroinverterType — all known and edge-case SKUs
 *   2. computeTypeMetrics — site count, microinverter count, severity breakdown
 *   3. computeSkuMetrics — microinverterType and microinverterCount fields
 *   4. Filter cascading — microinverterType filter applied in both providers
 */

import { describe, it, expect } from 'vitest';
import {
  classifyMicroinverterType,
  getSkuFamily,
  MICROINVERTER_TYPE_COLORS,
  MICROINVERTER_TYPE_LABELS,
} from '../src/utils/skuFamily';
import { computeTypeMetrics, computeSkuMetrics } from '../src/services/FleetAnalytics';
import type { Site } from '../src/types/site';
import { MockDataProvider } from '../src/services/MockDataProvider';

// ── 1. Classification ────────────────────────────────────────────────────────

describe('classifyMicroinverterType', () => {
  it('classifies IQ8 SKUs correctly', () => {
    const iq8Skus = [
      'IQ8P-3P-72-E-US',
      'IQ8H-3P-72-E-US',
      'IQ8P-3P-72-E-DOM-US',
      'IQ8M-240-2-US',
      'iq8p-3p-72-e-us',     // lowercase
      'IQ8',
    ];
    iq8Skus.forEach(sku => {
      expect(classifyMicroinverterType(sku), `SKU "${sku}"`).toBe('IQ8');
    });
  });

  it('classifies IQ9 SKUs correctly', () => {
    const iq9Skus = [
      'IQ9N-3P-277-A-DOM-US',
      'IQ9S-72-2-US',
      'iq9n-dom-us',         // lowercase
      'IQ9',
    ];
    iq9Skus.forEach(sku => {
      expect(classifyMicroinverterType(sku), `SKU "${sku}"`).toBe('IQ9');
    });
  });

  it('classifies non-IQ8/IQ9 SKUs as OTHER', () => {
    const otherSkus = ['IQ7+', 'IQ6', 'M215', 'M250', 'IQ7A-72-2-US'];
    otherSkus.forEach(sku => {
      expect(classifyMicroinverterType(sku), `SKU "${sku}"`).toBe('OTHER');
    });
  });

  it('classifies empty/null/undefined SKU as UNKNOWN', () => {
    expect(classifyMicroinverterType('')).toBe('UNKNOWN');
    expect(classifyMicroinverterType('  ')).toBe('UNKNOWN');
    expect(classifyMicroinverterType(null)).toBe('UNKNOWN');
    expect(classifyMicroinverterType(undefined)).toBe('UNKNOWN');
  });

  it('backward compat: getSkuFamily maps correctly', () => {
    expect(getSkuFamily('IQ8P-3P-72-E-US')).toBe('IQ8');
    expect(getSkuFamily('IQ9N-3P-277-A-DOM-US')).toBe('IQ9');
    expect(getSkuFamily('')).toBe('Unknown');
    expect(getSkuFamily('M215')).toBe('Unknown');
  });
});

describe('MICROINVERTER_TYPE constants', () => {
  it('has labels for all four types', () => {
    expect(MICROINVERTER_TYPE_LABELS.IQ8).toBe('IQ8');
    expect(MICROINVERTER_TYPE_LABELS.IQ9).toBe('IQ9');
    expect(MICROINVERTER_TYPE_LABELS.OTHER).toBe('Other');
    expect(MICROINVERTER_TYPE_LABELS.UNKNOWN).toBe('Unknown');
  });

  it('has colors for all four types', () => {
    (['IQ8', 'IQ9', 'OTHER', 'UNKNOWN'] as const).forEach(t => {
      expect(MICROINVERTER_TYPE_COLORS[t]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSite(overrides: Partial<Site>): Site {
  return {
    siteId: 'TEST-1',
    siteName: 'Test Site',
    siteStage: 'Final',
    siteStatus: 'Normal',
    statusReason: '',
    lastIntervalEndDate: '',
    microCount: 10,
    envoyCount: 1,
    miProductSku: 'IQ8P-3P-72-E-US',
    microinverterType: 'IQ8',
    envoyType: 'IQ Gateway Commercial',
    installerName: 'Test Installer',
    state: 'CA',
    country: 'US',
    connectionType: 'Wifi',
    severity: null,
    severitySubcategory: null,
    invProduced: '',
    invParamBld: '',
    hasOpenCase: false,
    meterEnergy: 0,
    microEnergy: 0,
    energyPerMicroPerDay: 0,
    daysProducing: 0,
    siteCreatedAt: '2025-01-01',
    emuSwVersion: '',
    healthScore: 90,
    ...overrides,
  };
}

// ── 2. computeTypeMetrics ────────────────────────────────────────────────────

describe('computeTypeMetrics', () => {
  const sites: Site[] = [
    makeSite({ siteId: 'A', microinverterType: 'IQ8', microCount: 100, severity: null }),
    makeSite({ siteId: 'B', microinverterType: 'IQ8', microCount: 200, severity: 1 }),
    makeSite({ siteId: 'C', microinverterType: 'IQ9', microCount: 50,  severity: 2 }),
    makeSite({ siteId: 'D', microinverterType: 'UNKNOWN', microCount: 10, severity: null }),
  ];

  it('returns one entry per type present in the data', () => {
    const result = computeTypeMetrics(sites);
    const types = result.map(t => t.type);
    expect(types).toContain('IQ8');
    expect(types).toContain('IQ9');
    expect(types).toContain('UNKNOWN');
    expect(types).not.toContain('OTHER');
  });

  it('computes correct microinverter counts', () => {
    const result = computeTypeMetrics(sites);
    const iq8 = result.find(t => t.type === 'IQ8')!;
    const iq9 = result.find(t => t.type === 'IQ9')!;
    expect(iq8.microinverterCount).toBe(300);   // 100 + 200
    expect(iq9.microinverterCount).toBe(50);
  });

  it('computes correct site counts', () => {
    const result = computeTypeMetrics(sites);
    const iq8 = result.find(t => t.type === 'IQ8')!;
    expect(iq8.siteCount).toBe(2);
  });

  it('computes correct percentage of fleet microinverters', () => {
    const result = computeTypeMetrics(sites);
    const iq8 = result.find(t => t.type === 'IQ8')!;
    // 300/360 = 83.3%
    expect(iq8.pctOfFleetMicros).toBeCloseTo(83.3, 0);
  });

  it('counts severity correctly per type', () => {
    const result = computeTypeMetrics(sites);
    const iq8 = result.find(t => t.type === 'IQ8')!;
    const iq9 = result.find(t => t.type === 'IQ9')!;
    expect(iq8.sev1).toBe(1);
    expect(iq8.sev2).toBe(0);
    expect(iq9.sev2).toBe(1);
  });

  it('sums of all type microinverter counts equal total fleet micros', () => {
    const result = computeTypeMetrics(sites);
    const total = result.reduce((s, t) => s + t.microinverterCount, 0);
    const expected = sites.reduce((s, x) => s + x.microCount, 0);
    expect(total).toBe(expected);
  });

  it('sums of all type site counts equal total fleet sites', () => {
    const result = computeTypeMetrics(sites);
    const total = result.reduce((s, t) => s + t.siteCount, 0);
    expect(total).toBe(sites.length);
  });

  it('returns empty array for empty fleet', () => {
    expect(computeTypeMetrics([])).toHaveLength(0);
  });
});

// ── 3. computeSkuMetrics ─────────────────────────────────────────────────────

describe('computeSkuMetrics', () => {
  const sites: Site[] = [
    makeSite({ siteId: 'A', miProductSku: 'IQ8P-3P-72-E-US', microinverterType: 'IQ8', microCount: 100 }),
    makeSite({ siteId: 'B', miProductSku: 'IQ8P-3P-72-E-US', microinverterType: 'IQ8', microCount: 50  }),
    makeSite({ siteId: 'C', miProductSku: 'IQ9N-3P-277-A-DOM-US', microinverterType: 'IQ9', microCount: 20 }),
  ];

  it('includes microinverterType on each SKU row', () => {
    const result = computeSkuMetrics(sites);
    const iq8p = result.find(s => s.sku === 'IQ8P-3P-72-E-US')!;
    expect(iq8p.microinverterType).toBe('IQ8');
    const iq9n = result.find(s => s.sku === 'IQ9N-3P-277-A-DOM-US')!;
    expect(iq9n.microinverterType).toBe('IQ9');
  });

  it('sums microinverterCount correctly per SKU', () => {
    const result = computeSkuMetrics(sites);
    const iq8p = result.find(s => s.sku === 'IQ8P-3P-72-E-US')!;
    expect(iq8p.microinverterCount).toBe(150);   // 100 + 50
    const iq9n = result.find(s => s.sku === 'IQ9N-3P-277-A-DOM-US')!;
    expect(iq9n.microinverterCount).toBe(20);
  });

  it('site count matches sites that have that SKU', () => {
    const result = computeSkuMetrics(sites);
    const iq8p = result.find(s => s.sku === 'IQ8P-3P-72-E-US')!;
    expect(iq8p.siteCount).toBe(2);
  });
});

// ── 4. MockDataProvider filter ────────────────────────────────────────────────

describe('MockDataProvider microinverterType filter', () => {
  const provider = new MockDataProvider();

  it('all mock sites have a microinverterType field', async () => {
    const sites = await provider.getSites();
    sites.forEach(s => {
      expect(['IQ8', 'IQ9', 'OTHER', 'UNKNOWN']).toContain(s.microinverterType);
    });
  });

  it('filtering by IQ8 returns only IQ8 sites', async () => {
    const sites = await provider.getSites({ microinverterType: ['IQ8'] });
    sites.forEach(s => expect(s.microinverterType).toBe('IQ8'));
  });

  it('filtering by IQ9 returns only IQ9 sites', async () => {
    const sites = await provider.getSites({ microinverterType: ['IQ9'] });
    sites.forEach(s => expect(s.microinverterType).toBe('IQ9'));
  });

  it('getFilterOptions returns microinverterType options', async () => {
    const opts = await provider.getFilterOptions('microinverterType');
    expect(opts.length).toBeGreaterThan(0);
    opts.forEach(o => expect(['IQ8', 'IQ9', 'OTHER', 'UNKNOWN']).toContain(o));
  });

  it('IQ8 + IQ9 site counts add up to less than or equal to total', async () => {
    const all  = await provider.getSites();
    const iq8  = await provider.getSites({ microinverterType: ['IQ8'] });
    const iq9  = await provider.getSites({ microinverterType: ['IQ9'] });
    expect(iq8.length + iq9.length).toBeLessThanOrEqual(all.length);
  });

  it('IQ8 microinverter count from filtered sites is accurate', async () => {
    const iq8Sites = await provider.getSites({ microinverterType: ['IQ8'] });
    const iq8Micros = iq8Sites.reduce((s, x) => s + x.microCount, 0);
    expect(iq8Micros).toBeGreaterThan(0);
  });
});
