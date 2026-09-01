import type { HistoricalSeverity } from '../src/types';

const INSTALLERS = [
  'Solar and Wind Power LLC', 'Ecovolts', 'Vancouver Renewable Energy Cooperative',
  'GVC Electrical Service', 'Atlanta Solar Center', 'Division 16 Corporation',
  'Sumner Solar Inc', 'Phase Two', 'Royal Alle Heating AC Solar',
  'Eccocentre Solar', 'Flywheel Development LLC', 'Solar Power NW LLC',
  'Holsen Home Automation Solar', 'Halo Solar LLC', 'Palomar Solar and Roofing',
  'SunTech Pro Installers', 'Green Energy Solutions', 'Pacific Solar Group',
  'Mountain Electric Co', 'Valley Solar Partners',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateHistorical(): HistoricalSeverity[] {
  const rand = seededRandom(123);
  const data: HistoricalSeverity[] = [];
  const startDate = new Date('2025-05-27');
  const endDate = new Date('2026-09-01');

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0) continue; // skip Sundays
    const dateStr = d.toISOString().slice(0, 10);
    for (const installer of INSTALLERS) {
      const sev1 = Math.floor(rand() * 8);
      const sev2 = Math.floor(rand() * 5);
      const sev3 = Math.floor(rand() * 10);
      data.push({
        date: dateStr,
        installer,
        sev1, sev2, sev3,
        total: sev1 + sev2 + sev3,
      });
    }
  }
  return data;
}

export const mockHistoricalSeverity: HistoricalSeverity[] = generateHistorical();
