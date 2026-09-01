# Insight Inventory — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access**

---

## Discovery Status

Insight GUIDs cannot be determined without authenticated access to the Incorta dashboard. The dashboard URL redirects to Microsoft Azure AD SSO, preventing programmatic inspection.

## Expected Insights (from Phase 1 Screenshot Analysis)

The following insights are expected based on Phase 1 screenshot analysis. All insight GUIDs are UNKNOWN until authenticated access is available.

### Tab 1: Overview / Severity

| # | Expected Insight | Type | Insight GUID | Source | Priority | Status |
|---|---|---|---|---|---|---|
| 1 | Total C&I Sites (KPI) | KPI / Number | UNKNOWN | Business View | Critical | UNVERIFIED |
| 2 | % Sites in Sev 1/2/3 (KPI) | KPI / Number | UNKNOWN | Business View | Critical | UNVERIFIED |
| 3 | # Sites in Sev 1/2/3 (KPI) | KPI / Number | UNKNOWN | Business View | Critical | UNVERIFIED |
| 4 | Sev 1/2/3 (a) (KPI) | KPI / Number | UNKNOWN | Business View | Critical | UNVERIFIED |
| 5 | Sev 1/2/3 (b) (KPI) | KPI / Number | UNKNOWN | Business View | Critical | UNVERIFIED |
| 6 | Sev 1/2/3 (c) (KPI) | KPI / Number | UNKNOWN | Business View | Critical | UNVERIFIED |
| 7 | % Sites in Sev 4 (KPI) | KPI / Number | UNKNOWN | Business View | High | UNVERIFIED |
| 8 | # Sites in Sev 4 (KPI) | KPI / Number | UNKNOWN | Business View | High | UNVERIFIED |
| 9 | % Sev 1 (KPI) | KPI / Percentage | UNKNOWN | Business View | Medium | UNVERIFIED |
| 10 | % Sev 2 (KPI) | KPI / Percentage | UNKNOWN | Business View | Medium | UNVERIFIED |
| 11 | % Sev 3 (KPI) | KPI / Percentage | UNKNOWN | Business View | Medium | UNVERIFIED |
| 12 | % Sev 4 (KPI) | KPI / Percentage | UNKNOWN | Business View | Medium | UNVERIFIED |
| 13 | Severity Breakdown (Sev 1/2/3/4 with a/b/c) | Table / Panel | UNKNOWN | Business View | Critical | UNVERIFIED |
| 14 | C&I Sites with Severity (Site Table) | Table | UNKNOWN | Business View | Critical | UNVERIFIED |

### Tab 2: Open Cases

| # | Expected Insight | Type | Insight GUID | Source | Priority | Status |
|---|---|---|---|---|---|---|
| 15 | C&I Sites & SFDC OPEN Cases Only (526 rows) | Table | UNKNOWN | Business View | Critical | UNVERIFIED |
| 16 | C&I Sites & SFDC NO OPEN Cases (16 rows) | Table | UNKNOWN | Business View | Critical | UNVERIFIED |

### Tab 3: Case Tracker

| # | Expected Insight | Type | Insight GUID | Source | Priority | Status |
|---|---|---|---|---|---|---|
| 17 | C&I Sites Case Tracker (583 rows, 12 columns) | Table | UNKNOWN | Business View | Critical | UNVERIFIED |

### Tab 4: Historical

| # | Expected Insight | Type | Insight GUID | Source | Priority | Status |
|---|---|---|---|---|---|---|
| 18 | Historical Data per Installer (497 rows, pivot) | Pivot Table | UNKNOWN | Business View | High | UNVERIFIED |

## How to Discover Insight GUIDs

### Method 1: Browser URL Inspection
1. Open the dashboard in an authenticated browser
2. For each insight, click the **focus/expand** icon (expand arrows) in the top-right corner
3. The browser URL will change to include the insight GUID:
   ```
   https://enphase-1.cloud2.incorta.com/incorta/!enphase/#/dashboard/{dashboardGuid}/tab/{tabGuid}/insight/{insightGuid}
   ```
4. Record each `insightGuid`

### Method 2: Public API v2
If a PAT is available, the Dashboard Prompts endpoint may reveal insight structure:
```
GET https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/dashboards/ee817bdb-9b6a-4135-97d2-52ac36e23c63/prompts
Authorization: Bearer {PAT}
```

### Method 3: Incorta Admin
An Incorta admin can export the dashboard definition which would include all tab and insight GUIDs.
