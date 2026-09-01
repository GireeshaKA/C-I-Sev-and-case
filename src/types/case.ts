export type CaseStatus = 'Open' | 'Closed' | 'Escalated' | 'In Progress' | 'Pending';

export type CaseCategory = 'Performance' | 'Communication' | 'Hardware' | 'Software' | 'Grid' | 'Other';

export type CaseType = 'Reactive' | 'Proactive' | 'Customer Initiated';

export interface SfdcCase {
  caseNumber: string;
  caseStatus: CaseStatus;
  severity: string;
  caseCategory: CaseCategory;
  caseType: CaseType;
  siteId: string;
  siteName: string;
  subject: string;
  description: string;
  createdDate: string;
  closedDate: string | null;
  lastModifiedDate: string;
  owner: string;
  age: number;
  priority: string;
}
