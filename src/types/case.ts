export type CaseStatus = 'New' | 'Case - In Progress';

export type CaseCategory = 'Microinverter' | 'Envoy' | 'Meter' | 'Other';

export type CaseType =
  | 'MI. Drop Out'
  | 'MI. AC Branch Issue'
  | 'MI. Low Power'
  | 'Envoy. Not Reporting'
  | 'Meter. Issue';

export interface SfdcCase {
  caseNumber: string;
  siteId: string;
  siteLink: string;
  siteName: string;
  siteStatus: string;
  lastIntervalEndDate: string;
  miProductSku: string;
  connectionType: string;
  caseStatus: CaseStatus;
  severity: string;
  caseCategory: CaseCategory;
  caseType: CaseType;
}
