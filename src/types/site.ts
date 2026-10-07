import type { MicroinverterType } from '../utils/skuFamily';
export type { MicroinverterType };

export type SeverityLevel = 1 | 2 | 3 | 4 | null;

export type SeveritySubcategory = 'a' | 'b' | 'c';

export type SiteStage = 'Ready' | 'Final' | 'Verifying';

export type SiteStatus =
  | 'Normal'
  | 'Production Issue'
  | 'Microinverters Not Reporting'
  | 'Envoy Not Reporting'
  | 'Meter Issue';

export type ConnectionType = 'Ethernet' | 'Wifi' | 'Cellular';

export type EnvoyType =
  | 'IQD Commercial Gateway'
  | 'IQ Gateway Commercial'
  | 'IQ Gateway Commercial Si';

export interface Site {
  siteId: string;
  siteName: string;
  siteStage: SiteStage;
  siteStatus: SiteStatus;
  statusReason: string;
  lastIntervalEndDate: string;
  microCount: number;
  envoyCount: number;
  miProductSku: string;
  envoyType: EnvoyType;
  installerName: string;
  state: string;
  country: string;
  connectionType: ConnectionType;
  severity: SeverityLevel;
  severitySubcategory: SeveritySubcategory | null;
  invProduced: string;
  invParamBld: string;
  hasOpenCase: boolean;
  /* — extended fields from Incorta insight — */
  meterEnergy: number;
  microEnergy: number;
  energyPerMicroPerDay: number;
  daysProducing: number;
  siteCreatedAt: string;
  emuSwVersion: string;
  healthScore: number;          // 0-100 composite score computed at ingest
  microinverterType: MicroinverterType;  // DERIVED from miProductSku via classifyMicroinverterType()
}
