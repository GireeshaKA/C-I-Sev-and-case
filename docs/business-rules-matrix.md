# Business Rules Matrix — C&I Severity and Cases Dashboard

> Phase 2B deliverable.
> Classification: **CONFIRMED** = directly visible in screenshots/documentation | **INFERRED** = logically deduced | **UNRESOLVED** = requires stakeholder confirmation before live integration.

---

## A. Site

### Definition

A C&I (Commercial & Industrial) site is a physical solar installation with Enphase equipment. It is the primary entity in this dashboard.

### Confirmed Values

| Attribute | Values | Status |
|---|---|---|
| Site Id | Numeric string, e.g., `6256648` | CONFIRMED |
| Site Name | Free-text, e.g., `Derek Shannon 2040 South Navajo` | CONFIRMED |
| Site Stage | `Ready`, `Final`, `Verifying` | CONFIRMED |
| Site Status | `Normal`, `Production Issue`, `Microinverters Not Reporting`, `Envoy Not Reporting`, `Meter Issue` | CONFIRMED |
| Last Interval End Date (PST) | Datetime string, e.g., `2026-09-01 01:57:38` | CONFIRMED |
| Micro Count | Integer, e.g., `22` | CONFIRMED |
| Envoy Count | Integer, e.g., `1` | CONFIRMED |
| MI Product SKU | String, e.g., `IQ8P-3P-72-E-US` | CONFIRMED |
| Envoy Types | `IQD Commercial Gateway`, `IQ Gateway Commercial`, `IQ Gateway Commercial Si` | CONFIRMED |
| Installer Name | Free-text, e.g., `Solar and Wind Power LLC` | CONFIRMED |
| State | 2-letter abbreviation, e.g., `CA`, `MD`; also `Unknown`, `QROO` (non-US) | CONFIRMED |
| Country | 2-letter code, e.g., `US`, `MX` | CONFIRMED |
| Connection Type | `Ethernet`, `Wifi`, `Cellular` | CONFIRMED |
| Severity | `1`, `2`, `3`, `4`, or `null` (no severity) | CONFIRMED |
| Severity Subcategory | `a`, `b`, `c`, or `null` | CONFIRMED for Sev 1/2/3; UNRESOLVED for Sev 4 |
| Inv Produced | Version string, e.g., `521-00006-r-06-r02-57.03` | CONFIRMED (Screenshot 1 only) |
| Inv ParamBld | Version string, e.g., `549-00068-r01-r02-57.03` | CONFIRMED (Screenshot 1 only) |

### Code Representation

- Type: `Site` interface in `src/types/site.ts`
- `severity: SeverityLevel` where `SeverityLevel = 1 | 2 | 3 | 4 | null`
- `severitySubcategory: SeveritySubcategory | null` where `SeveritySubcategory = 'a' | 'b' | 'c'`
- `hasOpenCase: boolean` — derived attribute

### What Must Be Confirmed Before Live Integration

1. Complete list of Site Stage values — are `Ready`, `Final`, `Verifying` exhaustive?
2. Complete list of Site Status values — are the 5 confirmed values exhaustive?
3. How is severity level assigned to a site? (See Severity section)
4. How is `hasOpenCase` derived from source data?
5. Whether additional fields exist in the source that are not visible in screenshots

---

## B. Severity

### Definition

Severity is a numeric level (1–4) assigned to a C&I site, indicating the degree of operational concern. Sev 1 is highest severity; Sev 4 is lowest.

### Confirmed Values

| Level | Confirmed Count | Status |
|---|---|---|
| 1 | 139 | CONFIRMED |
| 2 | 67 | CONFIRMED |
| 3 | 128 | CONFIRMED |
| 4 | 123 | CONFIRMED |
| No Severity (null) | 1,603 (implied) | INFERRED — see Section D below |

### Source

- Screenshot 1: KPI section and severity breakdown
- `docs/dashboard-requirements.md`: cross-validated counts

### Code Representation

- `SeverityLevel = 1 | 2 | 3 | 4 | null` in `src/types/site.ts`

### What Must Be Confirmed Before Live Integration

1. **CRITICAL:** How is severity level (1, 2, 3, 4) calculated or assigned? Is it rule-based from site metrics, manually set, or inherited from SFDC? This is the most important unresolved business question.
2. Are severity levels mutually exclusive (a site can only have one level at a time)?
3. Can severity change over time?
4. Is `null` a formal category or simply the absence of a severity assignment?

---

## C. Severity Subcategory

### Definition

A letter suffix (a, b, c) appended to the severity level, indicating the case status context of a severity site.

### Confirmed Values (for Sev 1, 2, 3)

| Code | Meaning | Status |
|---|---|---|
| (a) | Site has an open case that is NOT marked as 'Case - In Progress' (i.e., status = 'New') | CONFIRMED |
| (b) | Site has an open case that IS marked as 'Case - In Progress' | CONFIRMED |
| (c) | Site has NO open cases | CONFIRMED |

### Confirmed Subcategory Counts

| Level | (a) | (b) | (c) | Total |
|---|---|---|---|---|
| Sev 1 | 13 | 121 | 5 | 139 ✓ |
| Sev 2 | 2 | 63 | 2 | 67 ✓ |
| Sev 3 | 16 | 103 | 9 | 128 ✓ |
| **Sev 1/2/3 Total** | **31** | **287** | **16** | **334** ✓ |

### Cross-Validation

- 13 + 121 + 5 = 139 ✓ (Sev 1)
- 2 + 63 + 2 = 67 ✓ (Sev 2)
- 16 + 103 + 9 = 128 ✓ (Sev 3)
- 31 + 287 + 16 = 334 ✓ (matches KPI #Sites in Sev 1/2/3)
- 13 + 2 + 16 = 31 ✓ (matches KPI Sev 1/2/3 (a))
- 121 + 63 + 103 = 287 ✓ (matches KPI Sev 1/2/3 (b))
- 5 + 2 + 9 = 16 ✓ (matches KPI Sev 1/2/3 (c))

### Sev 4 Subcategories

**Status: UNRESOLVED**

The Phase 1 screenshots show only two sub-values for Sev 4: `9` and `123`. The subcategory labels are partially cut off. It is NOT confirmed whether Sev 4 follows the same (a)/(b)/(c) breakdown as Sev 1/2/3.

The current mock data assigns Sev 4 sites subcategories `'b'` (100) and `'c'` (23). **This is an assumption, not a confirmed business rule.** The mock split was created to make the prototype functional and does not represent confirmed production values.

### Composite Severity String (Case Tracker)

In the Case Tracker, severity is displayed as a composite string: `{level}({subcategory})`.

Examples: `1(a)`, `2(b)`, `3(c)`, `1(c)`

**Status: CONFIRMED** from Screenshot 3.

### Code Representation

- `SeveritySubcategory = 'a' | 'b' | 'c'` in `src/types/site.ts`
- Composite string in `SfdcCase.severity: string` in `src/types/case.ts`
- Subcategory distribution calculated in `MockDataProvider.getSeverityDistribution()`

### What Must Be Confirmed Before Live Integration

1. Does Sev 4 follow the (a)/(b)/(c) breakdown?
2. Is the subcategory derived from case data at query time, or stored as an attribute?
3. What happens when a site has multiple cases in different statuses (e.g., one 'New' and one 'Case - In Progress')? Which subcategory wins?

---

## D. "No Severity" Population

### Reconciliation

| Population | Count | Source |
|---|---|---|
| Total C&I Sites | 2,060 | CONFIRMED (KPI) |
| Sev 1 | 139 | CONFIRMED |
| Sev 2 | 67 | CONFIRMED |
| Sev 3 | 128 | CONFIRMED |
| Sev 4 | 123 | CONFIRMED |
| **Sites in Sev 1–4** | **457** | CONFIRMED (139 + 67 + 128 + 123) |
| **Implied "No Severity"** | **1,603** | INFERRED (2,060 − 457) |

### Business Meaning

**Status: UNRESOLVED**

"No Severity" is a population observed by reconciliation — 1,603 sites that are not assigned severity levels 1, 2, 3, or 4. However:

- "No Severity" is NOT explicitly labeled as a category in any screenshot
- It is NOT displayed as a KPI in the reference dashboard
- It is unclear whether these are healthy sites, sites not yet assessed, or sites excluded by the severity algorithm

### Where "No Severity" Could Matter

| Dashboard Area | Impact | Current Behavior |
|---|---|---|
| Overview KPIs | `Total C&I Sites` includes all 2,060 including no-severity sites | Correct — denominator uses total |
| % Sev calculations | Percentage denominators use 2,060 (total) not 457 (severity only) | Correct — matches confirmed % values |
| Severity Distribution | Only shows Sev 1–4; no-severity not shown | Matches screenshots |
| Site Table (Overview) | Currently filters to `severity !== null` only | Matches severity-focused view |
| Site Health page | Shows all 2,060 sites | INFERRED — includes no-severity sites |
| Open Cases page | Shows sites with `hasOpenCase` regardless of severity | Could include no-severity sites with cases |
| Historical Data | Only tracks Sev 1/2/3 | CONFIRMED — no Sev 4 or No Severity in historical |

### Decision Required

- Should "No Severity" appear anywhere in the production dashboard?
- Should there be a way to view/filter the 1,603 non-severity sites?
- Is the Total C&I Sites KPI intended to always include non-severity sites?

---

## E. Site Status

### Definition

The current operational status of a C&I site, describing the nature of any active issue.

### Confirmed Values

| Status | Meaning | Status |
|---|---|---|
| Normal | Site operating normally | CONFIRMED |
| Production Issue | Site has a production-related issue | CONFIRMED |
| Microinverters Not Reporting | One or more microinverters are not communicating | CONFIRMED |
| Envoy Not Reporting | Envoy/gateway device is not communicating | CONFIRMED |
| Meter Issue | Revenue-grade meter has an issue | CONFIRMED |

### Business Rules

| Rule | Status |
|---|---|
| Statuses are mutually exclusive (one per site) | INFERRED — screenshots show one status per site row |
| Status represents current state (not historical) | INFERRED |
| Multiple conditions can exist simultaneously | UNRESOLVED — e.g., can a site have both "Production Issue" AND "Envoy Not Reporting"? |
| Status is calculated from source data vs. manually set | UNRESOLVED |
| Additional statuses exist beyond the confirmed 5 | UNRESOLVED |

### Code Representation

- `SiteStatus` union type in `src/types/site.ts`
- Badge styling via `statusBadgeClass()` in `App.tsx`
- Status distribution chart in Overview and Site Health pages (mock-derived counts)

### What Must Be Confirmed Before Live Integration

1. Are these 5 statuses exhaustive?
2. Are they mutually exclusive?
3. How is status determined from source data?
4. The mock-generated status distribution is NOT a confirmed reference — only the status labels are confirmed.

---

## F. Open Case

### Definition

An "open case" is an SFDC (Salesforce) case associated with a site that has not been closed.

### Confirmed Values

| Metric | Value | Status |
|---|---|---|
| Sites with at least one open SFDC case | 526 | CONFIRMED (Screenshot 2) |
| Severity sites without open cases | 16 | CONFIRMED (Screenshot 2) |
| Case statuses visible | `New`, `Case - In Progress` | CONFIRMED (Screenshot 3) |

### Business Rules

| Rule | Status |
|---|---|
| "Open" means case status is `New` OR `Case - In Progress` | INFERRED — these are the only statuses visible |
| A site can have zero, one, or multiple open cases | INFERRED — Case Tracker has 583 case rows for 526 sites with cases |
| `hasOpenCase` is true if site has ≥1 case with open status | INFERRED |
| Additional case statuses exist (e.g., `Closed`, `Resolved`) | UNRESOLVED |
| Definition of "open" case (which statuses qualify) | UNRESOLVED — need confirmation that `New` and `Case - In Progress` are the only "open" statuses |

### Derivation of Subcategory from Cases

| Subcategory | Derivation | Status |
|---|---|---|
| (a) | Site has ≥1 open case AND none of those cases is 'Case - In Progress' | INFERRED |
| (b) | Site has ≥1 open case AND at least one is 'Case - In Progress' | INFERRED |
| (c) | Site has zero open cases | INFERRED |

**UNRESOLVED:** When a site has both a 'New' case AND a 'Case - In Progress' case, which subcategory applies? The current inference is (b) because at least one case is in progress, but this has not been confirmed.

### Code Representation

- `Site.hasOpenCase: boolean` in `src/types/site.ts`
- Open case sites filtered as `sites.filter(s => s.hasOpenCase)` in `App.tsx`
- Mock data derives `hasOpenCase` from subcategory: `sub === 'a' || sub === 'b'`

### What Must Be Confirmed Before Live Integration

1. Exact definition of "open" case — which SFDC statuses qualify?
2. Multi-case aggregation: how does subcategory assignment work when multiple cases exist with different statuses?
3. Can a site with no severity have an open case?

---

## G. Case Status

### Definition

The current status of an SFDC case.

### Confirmed Values

| Value | Meaning | Status |
|---|---|---|
| New | Case has been created but not yet being worked | CONFIRMED |
| Case - In Progress | Case is actively being worked | CONFIRMED |

### Code Representation

- `CaseStatus = 'New' | 'Case - In Progress'` in `src/types/case.ts`

### What Must Be Confirmed Before Live Integration

1. Are there additional case statuses (e.g., `Closed`, `Escalated`, `Resolved`, `Pending`)?
2. If so, which are considered "open" for the Open Cases page?
3. Is the transition New → Case - In Progress the only workflow path?

---

## H. Case Tracker

### Definition

A case-level table showing individual SFDC case records with linked site information.

### Confirmed Structure (12 columns)

| # | Column | Data Type | Source | Nullable | Unique | Site or Case Attr | Status |
|---|---|---|---|---|---|---|---|
| 1 | Case Number | String (8-digit numeric) | SFDC | No | Yes | Case | CONFIRMED |
| 2 | Site Id | String (numeric) | SFDC/Incorta | No | No | Site | CONFIRMED |
| 3 | Site Link | String (numeric) | Incorta | No | No | Site (display) | CONFIRMED |
| 4 | Site Name | String | SFDC/Incorta | No | No | Site | CONFIRMED |
| 5 | Site Status | Enum | Incorta | No | No | Site | CONFIRMED |
| 6 | Last Interval End Date (PST) | Datetime string | Incorta | No | No | Site | CONFIRMED |
| 7 | MI Product Sku | String | Incorta | No | No | Site | CONFIRMED |
| 8 | Connection Type | Enum | Incorta | No | No | Site | CONFIRMED |
| 9 | Case Status | Enum | SFDC | No | No | Case | CONFIRMED |
| 10 | Severity | Composite string | Derived | No | No | Derived | CONFIRMED |
| 11 | Case Category | Enum | SFDC | No | No | Case | CONFIRMED |
| 12 | Case Type | String | SFDC | No | No | Case | CONFIRMED |

### Confirmed Reference Row Count

583 rows (CONFIRMED from Screenshot 3).

### Code Representation

- `SfdcCase` interface in `src/types/case.ts`
- `siteLink` is currently set equal to `siteId` (confirmed from screenshots)
- `severity` is stored as a composite string e.g., `"3(b)"`

### What Must Be Confirmed Before Live Integration

1. Complete list of Case Category values — only `Microinverter` confirmed
2. Complete list of Case Type values — only `MI. Drop Out` and `MI. AC Branch Issue` confirmed
3. Is Case Number globally unique?
4. Can a case be associated with multiple sites?
5. Where does the severity composite string originate — is it stored in SFDC or calculated?

---

## I. Historical Data

### Definition

Daily severity count snapshots per installer, tracking Sev-1, Sev-2, Sev-3 site counts over time.

### Confirmed Structure

| Field | Type | Status |
|---|---|---|
| Date | Date string (YYYY-MM-DD) | CONFIRMED |
| Installer | String | CONFIRMED |
| Sev-1 Sites | Integer | CONFIRMED |
| Sev-2 Sites | Integer | CONFIRMED |
| Sev-3 Sites | Integer | CONFIRMED |
| Total | Integer | CONFIRMED |

### Business Rules

| Rule | Status |
|---|---|
| Data is per-installer, per-date | CONFIRMED |
| Data saved since 2025-05-27 | CONFIRMED |
| Granularity is daily | CONFIRMED |
| Total = Sev-1 + Sev-2 + Sev-3 | CONFIRMED (screenshots show this relationship) |
| Sev-4 is NOT included | CONFIRMED (absent from historical columns) |
| "No Severity" is NOT included | INFERRED (no column for it) |
| Gaps in dates are possible (e.g., 2026-08-30 missing) | CONFIRMED |
| Values are daily snapshots (not events/deltas) | INFERRED |
| Timezone for date values | UNRESOLVED |
| Reference row count: 497 | CONFIRMED (screenshot) — but this is not the production row count |

### Code Representation

- `HistoricalSeverity` interface in `src/types/severity.ts`
- `MockDataProvider.getHistoricalSeverity()` returns all records

### What Must Be Confirmed Before Live Integration

1. Are values daily snapshots (count at end of day) or cumulative/delta?
2. What timezone are dates in?
3. Why are some dates missing (weekends? processing failures?)?
4. Why is Sev-4 excluded from historical data?
5. What is the actual production row count and data volume?

---

## J. Connection Type

### Definition

The network connection type used by the site's Envoy/gateway device.

### Confirmed Values

| Value | Status |
|---|---|
| Ethernet | CONFIRMED |
| Wifi | CONFIRMED |
| Cellular | CONFIRMED |

### Code Representation

- `ConnectionType = 'Ethernet' | 'Wifi' | 'Cellular'` in `src/types/site.ts`
- Used as a filter field in `DashboardFilters`

### What Must Be Confirmed Before Live Integration

1. Are these 3 values exhaustive?
2. Can a site have multiple connection types?

---

## K. Site Stage Id

### Definition

The lifecycle stage of the C&I site.

### Confirmed Values

| Value | Status |
|---|---|
| Ready | CONFIRMED |
| Final | CONFIRMED |
| Verifying | CONFIRMED |

### Code Representation

- `SiteStage = 'Ready' | 'Final' | 'Verifying'` in `src/types/site.ts`
- Used as a filter field in `DashboardFilters`

### What Must Be Confirmed Before Live Integration

1. Are these 3 values exhaustive?
2. What do they mean in the site lifecycle?
3. Can a site transition between stages?

---

## L. MI Product SKU

### Definition

The microinverter product SKU installed at the site.

### Confirmed Values (from screenshots)

- `IQ8H-3P-72-E-US`
- `IQ8P-3P-72-E-DOM-US`
- `IQ8P-3P-72-E-US`
- `IQ9N-3P-277-A-DOM-US`
- `IQ9N-3P-277-A-US`
- `IQ9S-3P-277-B-DOM-US`

### Code Representation

- `Site.miProductSku: string` (free-text, not enum-constrained)
- Used as a filter field in `DashboardFilters`

### What Must Be Confirmed Before Live Integration

1. Is this the complete SKU list or just the filtered view?
2. Can a site have multiple SKUs?
3. Is the SKU filter in the screenshots a hardcoded scope or user-selected?

---

## M. Installer

### Definition

The company that installed the solar equipment at a C&I site.

### Business Rules

| Rule | Status |
|---|---|
| Each site has one installer | INFERRED |
| One installer may have many sites | CONFIRMED (historical data groups by installer) |
| Installer is used as the row dimension in historical data | CONFIRMED |

### Code Representation

- `Site.installerName: string`
- `HistoricalSeverity.installer: string`
- Available as a filter option via `getFilterOptions('installerName')`

### What Must Be Confirmed Before Live Integration

1. Is installer name the canonical identifier, or is there an installer ID?
2. Can installer names change over time?
3. Are installer names consistent between site data and historical data?
