import type { SfdcCase, CaseStatus, CaseCategory, CaseType } from '../src/types';
import { mockSites } from './sites';

const CASE_CATEGORIES: CaseCategory[] = ['Microinverter', 'Envoy', 'Meter', 'Other'];
const CASE_TYPES: CaseType[] = ['MI. Drop Out', 'MI. AC Branch Issue', 'MI. Low Power', 'Envoy. Not Reporting', 'Meter. Issue'];
const OWNERS = [
  'Alex Chen', 'Priya Sharma', 'Jordan Lee', 'Sam Rodriguez', 'Morgan Taylor',
  'Casey Williams', 'Riley Johnson', 'Dakota Brown', 'Jamie Patel', 'Quinn Martinez',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rand = seededRandom(99);
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function generateCases(): SfdcCase[] {
  const cases: SfdcCase[] = [];
  const sitesWithCases = mockSites.filter(s => s.hasOpenCase);

  for (const site of sitesWithCases) {
    const numCases = Math.floor(rand() * 2) + 1;
    for (let i = 0; i < numCases; i++) {
      const sub = site.severitySubcategory ?? 'b';
      const caseStatus: CaseStatus = sub === 'a' ? 'New' : 'Case - In Progress';
      const age = Math.floor(rand() * 60) + 1;
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
        caseOwner: pick(OWNERS),
        caseAge: age,
        createdDate: daysAgo(age),
        lastUpdate: daysAgo(Math.floor(rand() * Math.min(age, 14))),
        installerName: site.installerName,
        state: site.state,
      });
    }
  }
  return cases;
}

export const mockCases: SfdcCase[] = generateCases();
