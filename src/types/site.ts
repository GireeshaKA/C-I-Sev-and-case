export type SeverityLevel = 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'No Severity';

export type SiteStage = 'Active' | 'Inactive' | 'Decommissioned' | 'Pending';

export type SiteStatus = 'Normal' | 'Warning' | 'Critical' | 'Offline' | 'Unknown';

export type ConnectionType = 'Ethernet' | 'WiFi' | 'Cellular' | 'Unknown';

export type EnvoyType = 'IQ Gateway' | 'IQ Gateway Commercial' | 'Envoy-S' | 'Unknown';

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
  systemSize: number;
  activationDate: string;
}
