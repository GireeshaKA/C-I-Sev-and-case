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
}
