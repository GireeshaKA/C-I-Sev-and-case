import type { Site, SiteStage, SiteStatus, ConnectionType, EnvoyType, SeverityLevel, SeveritySubcategory } from '../src/types';
import { classifyMicroinverterType } from '../src/utils/skuFamily';

const NAMES = [
  'Derek Shannon 2040 South Navajo','Dunsoth Fire Department','Chrome Solar Corp',
  'Taylor Manor PV','Nimey Kennedy','Colorado Vinyard Specialists',
  'Casa Metropolitans 2','Slippery Senior','Loudon Storage','BAUER_55',
  'Rosario Sanchez 121','Diane Boutin','Brandywine 724','Panda Express Richland',
  'Oak Grove Eleison','BoF Farmington 35kW Roof','Palomar Solar AGA Tools',
  'Greenfield Commerce Center','Sunset Valley Office Park','Highland Tech Campus',
  'Metro Distribution Hub','Pacific Coast Warehouse','Mountain View Solar Farm',
  'Riverside Business Complex','Harbor Point Marina','Eagle Ridge Community',
  'Prairie Wind Station','Silver Lake Industrial','Cedar Heights Medical',
  'Diamond Valley School','Golden Gate Storage','Lakewood Shopping Center',
  'Pine Ridge Data Center','Maple Creek Office','Oakmont Professional',
  'Summit View Apartments','Blue Water Treatment','Crystal Springs Resort',
  'Iron Bridge Manufacturing','Northstar Logistics','Redwood Plaza',
  'Silverstone Auto Center','Westfield Commons','Valley Forge Industrial',
  'Emerald Bay Hotel','Copperfield Retail','Liberty Bell Complex',
  'Meadowbrook Farms','Stonegate Business Park','Timber Ridge Warehouse',
];
const INSTALLERS = [
  'Solar and Wind Power LLC','Ecovolts','Vancouver Renewable Energy Cooperative',
  'GVC Electrical Service','Atlanta Solar Center','Division 16 Corporation',
  'Sumner Solar Inc','Phase Two','Royal Alle Heating AC Solar',
  'Eccocentre Solar','Flywheel Development LLC','Solar Power NW LLC',
  'Holsen Home Automation Solar','Halo Solar LLC','Palomar Solar and Roofing',
  'SunTech Pro Installers','Green Energy Solutions','Pacific Solar Group',
  'Mountain Electric Co','Valley Solar Partners',
];
const STATES = ['CA','CO','MD','WA','ND','IL','IA','DC','TX','NY','FL','OR','AZ','NV','GA'];
const COUNTRIES: string[] = ['US','US','US','US','US','US','US','US','US','MX'];
// Weighted to match real Incorta fleet distribution (verified via diagnose-columns.mjs):
//   IQ8P-3P-72-E-US:     ~53%  (266/500 rows observed)
//   IQ8H-3P-72-E-US:     ~24%  (122/500)
//   IQ8P-3P-72-E-DOM-US: ~20%  (100/500)
//   IQ9N-3P-277-A-DOM-US: ~3%  (12/500)
const SKUS = [
  ...Array(16).fill('IQ8P-3P-72-E-US'),
  ...Array(7).fill('IQ8H-3P-72-E-US'),
  ...Array(6).fill('IQ8P-3P-72-E-DOM-US'),
  'IQ9N-3P-277-A-DOM-US',
];
const STAGES: SiteStage[] = ['Ready','Final','Verifying'];
const STATUSES: SiteStatus[] = ['Normal','Production Issue','Microinverters Not Reporting','Envoy Not Reporting','Meter Issue'];
const CONNS: ConnectionType[] = ['Ethernet','Wifi','Cellular'];
const ENVOYS: EnvoyType[] = ['IQD Commercial Gateway','IQ Gateway Commercial','IQ Gateway Commercial Si'];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const rand = seededRandom(42);
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }

function genId(): string { return String(5000000 + Math.floor(rand() * 2000000)); }
function genDate(): string {
  const m = Math.floor(rand() * 6) + 4, d = Math.floor(rand() * 28) + 1;
  const h = Math.floor(rand() * 24), mi = Math.floor(rand() * 60), sc = Math.floor(rand() * 60);
  return `2026-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')} ${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
}

function makeSite(sev: SeverityLevel, sub: SeveritySubcategory | null, idx: number): Site {
  const hasOpen = sub === 'a' || sub === 'b';
  const status: SiteStatus = hasOpen ? pick(STATUSES.filter(s => s !== 'Normal')) : (sev ? pick(STATUSES) : 'Normal');
  const sku = pick(SKUS);
  const microCount = Math.floor(rand() * 400) + 5;
  const days = Math.floor(rand() * 7) + 1;
  const energyBase = sev === 1 ? 200 : sev === 2 ? 600 : sev === 3 ? 900 : 1400;
  const energyPerMicro = energyBase + rand() * 500;
  let healthScore = 100;
  if (sev === 1) healthScore -= 40;
  else if (sev === 2) healthScore -= 25;
  else if (sev === 3) healthScore -= 15;
  else if (sev === 4) healthScore -= 5;
  if (status === 'Envoy Not Reporting') healthScore -= 30;
  else if (status === 'Microinverters Not Reporting') healthScore -= 25;
  else if (status === 'Production Issue') healthScore -= 15;
  else if (status === 'Meter Issue') healthScore -= 10;
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    siteId: genId(), siteName: NAMES[idx % NAMES.length],
    siteStage: pick(STAGES.filter(s => s !== 'Verifying')),
    siteStatus: status, statusReason: '',
    lastIntervalEndDate: genDate(), microCount,
    envoyCount: Math.floor(rand() * 4) + 1, miProductSku: sku,
    microinverterType: classifyMicroinverterType(sku),
    envoyType: pick(ENVOYS), installerName: pick(INSTALLERS),
    state: pick(STATES), country: pick(COUNTRIES), connectionType: pick(CONNS),
    severity: sev, severitySubcategory: sub,
    invProduced: `521-00006-r-${String(Math.floor(rand() * 10)).padStart(2,'0')}-r02-57.03`,
    invParamBld: '549-00068-r01-r02-57.03', hasOpenCase: hasOpen,
    meterEnergy: microCount * energyPerMicro * days * (0.95 + rand() * 0.1),
    microEnergy: microCount * energyPerMicro * days,
    energyPerMicroPerDay: Math.round(energyPerMicro * 10) / 10,
    daysProducing: days,
    siteCreatedAt: `2025-${String(Math.floor(rand() * 12) + 1).padStart(2,'0')}-${String(Math.floor(rand() * 28) + 1).padStart(2,'0')}`,
    emuSwVersion: `D${Math.floor(rand() * 3) + 7}.${Math.floor(rand() * 4)}.${Math.floor(rand() * 9999)}`,
    healthScore,
  };
}

function generateSites(): Site[] {
  const sites: Site[] = [];
  let i = 0;
  const plan: [SeverityLevel, SeveritySubcategory, number][] = [
    [1,'a',13],[1,'b',121],[1,'c',5],
    [2,'a',2],[2,'b',63],[2,'c',2],
    [3,'a',16],[3,'b',103],[3,'c',9],
    [4,'b',100],[4,'c',23],
  ];
  for (const [sev, sub, count] of plan) {
    for (let j = 0; j < count; j++, i++) sites.push(makeSite(sev, sub, i));
  }
  // Remaining 1603 sites have no severity
  for (let j = 0; j < 1603; j++, i++) sites.push(makeSite(null, null, i));
  return sites;
}

export const mockSites: Site[] = generateSites();
