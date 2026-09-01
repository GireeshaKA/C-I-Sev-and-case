import type { SfdcCase, CaseStatus, CaseCategory, CaseType } from '../src/types';
import { mockSites } from './sites';

const CASE_CATEGORIES: CaseCategory[] = ['Microinverter', 'Envoy', 'Meter', 'Other'];
const CASE_TYPES: CaseType[] = ['MI. Drop Out', 'MI. AC Branch Issue', 'MI. Low Power', 'Envoy. Not Reporting', 'Meter. Issue'];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rand = seededRandom(99);
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }

function generateCases(): SfdcCase[] {
  const cases: SfdcCase[] = [];
  const sitesWithCases = mockSites.filter(s => s.hasOpenCase);

  for (const site of sitesWithCases) {
    const numCases = Math.floor(rand() * 2) + 1;
    for (let i = 0; i < numCases; i++) {
      const sub = site.severitySubcategory ?? 'b';
      const caseStatus: CaseStatus = sub === 'a' ? 'New' : 'Case - In Progress';
      cases.push({
        caseNumber: String(19000000 + Math.floor(rand() * 2000000)),
        siteId: site.siteId,
        siteLink: site.siteId,
        siteName: site.siteName,
        siteStatus: site.siteStatus,
        lastIntervalEndDate: site.lastIntervalEndDate,
        miProductSku: site.miProductSku,
        connectionType: site.connectionType,
        caseStatus,
        severity: `${site.severity}(${sub})`,
        caseCategory: pick(CASE_CATEGORIES),
        caseType: pick(CASE_TYPES),
      });
    }
  }
  return cases;
}

export const mockCases: SfdcCase[] = generateCases();
