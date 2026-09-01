# Data Contract — C&I Severity and Cases Dashboard

> Phase 2B deliverable.
> Defines the logical data contract for eventual live-data integration.
> Classification: **CONFIRMED** = verified from screenshots | **INFERRED** = logically deduced | **UNRESOLVED** = requires confirmation.

---

## 1. KPI Data Contract

### Confirmed Reference Values

| # | KPI | Label | Reference Value | Type | Denominator | Calculation | Status |
|---|---|---|---|---|---|---|---|
| 1 | Total C&I Sites | Total C&I Sites | 2,060 | Count | N/A | Count of all C&I sites matching active filters | CONFIRMED |
| 2 | % Sites in Sev 1/2/3 | %Sites in Sev1/2/3 | 16.2% | Percentage | Total C&I Sites (2,060) | (Sev1 + Sev2 + Sev3) / Total × 100 | CONFIRMED |
| 3 | # Sites in Sev 1/2/3 | #Sites in Sev 1/2/3 | 334 | Count | N/A | Sum of sites at severity 1, 2, 3 | CONFIRMED |
| 4 | Sev 1/2/3 (a) | Sev 1/2/3 (a) | 31 | Count | N/A | Sev 1/2/3 sites with open case NOT 'Case - In Progress' | CONFIRMED |
| 5 | Sev 1/2/3 (b) | Sev 1/2/3 (b) | 287 | Count | N/A | Sev 1/2/3 sites with open case marked 'Case - In Progress' | CONFIRMED |
| 6 | Sev 1/2/3 (c) | Sev 1/2/3 (c) | 16 | Count | N/A | Sev 1/2/3 sites with NO open cases | CONFIRMED |
| 7 | % Sites in Sev 4 | Sites in Sev4 | 6.0% | Percentage | Total C&I Sites (2,060) | Sev4 / Total × 100 | CONFIRMED |
| 8 | # Sites in Sev 4 | #Sites in Sev 4 | 123 | Count | N/A | Count of sites at severity 4 | CONFIRMED |
| 9 | % Sites in Sev 1 | %Sites in Sev1 | 6.7% | Percentage | Total C&I Sites (2,060) | Sev1 / Total × 100 | CONFIRMED |
| 10 | % Sites in Sev 2 | %Sites in Sev2 | 3.3% | Percentage | Total C&I Sites (2,060) | Sev2 / Total × 100 | CONFIRMED |
| 11 | % Sites in Sev 3 | %Sites in Sev3 | 6.2% | Percentage | Total C&I Sites (2,060) | Sev3 / Total × 100 | CONFIRMED |
| 12 | Sites with Open Cases | Sites with Open Cases | 526 | Count | N/A | Sites with ≥1 open SFDC case | CONFIRMED |
| 13 | Sites without Open Cases | Sites without Open Cases | 16 | Count | N/A | Severity sites with 0 open cases | CONFIRMED |

### Arithmetic Verification

| Check | Calculation | Result | Pass |
|---|---|---|---|
| Sev 1+2+3 | 139 + 67 + 128 | 334 | ✓ |
| %Sev 1/2/3 | 334 / 2060 × 100 | 16.21% → 16.2% | ✓ |
| %Sev 4 | 123 / 2060 × 100 | 5.97% → 6.0% | ✓ |
| %Sev 1 | 139 / 2060 × 100 | 6.75% → 6.7% | ✓ |
| %Sev 2 | 67 / 2060 × 100 | 3.25% → 3.3% | ✓ |
| %Sev 3 | 128 / 2060 × 100 | 6.21% → 6.2% | ✓ |
| (a)+(b)+(c) | 31 + 287 + 16 | 334 | ✓ |
| %Sev1 + %Sev2 + %Sev3 | 6.7 + 3.3 + 6.2 | 16.2 | ✓ |
| Total severity sites | 334 + 123 | 457 | ✓ |
| Implied no-severity | 2060 − 457 | 1,603 | ✓ (INFERRED) |

### Percentage Rounding

All confirmed percentages use one decimal place. The rounding method appears to be:

- `Math.round(value * 10) / 10` (round to 1 decimal)

The current mock code uses `Math.round(value * 1000) / 10` which is equivalent to rounding to one decimal of a percentage.

### Denominator for Percentages

**Status: CONFIRMED** — All percentage KPIs use **Total C&I Sites** (2,060) as the denominator, NOT severity-only sites (457). This is verified by arithmetic:

- 334 / 2060 = 16.21% → rounds to 16.2% ✓
- If denominator were 457: 334 / 457 = 73.1% ≠ 16.2% ✗

### Value Classification

| Value | Classification |
|---|---|
| 2,060 (Total Sites) | Source/reference — from filtered dataset |
| 334 (#Sev 1/2/3) | Calculated — sum of per-level counts |
| 16.2% (%Sev 1/2/3) | Calculated — percentage of total |
| 31, 287, 16 (subcategories) | Calculated — from case status cross-reference |
| 123 (#Sev 4) | Source/reference — from filtered dataset |
| 6.0%, 6.7%, 3.3%, 6.2% | Calculated — percentages of total |
| 526, 16 (open/no-open case sites) | Source/reference — from case join |
| Mock status distribution counts | Mock-derived — NOT reference values |

---

## 2. Severity Subcategory Reconciliation

### Per-Level Breakdown

#### Sev 1

| Subcategory | Count | Status |
|---|---|---|
| (a) Open case, not In Progress | 13 | CONFIRMED |
| (b) Open case, In Progress | 121 | CONFIRMED |
| (c) No open cases | 5 | CONFIRMED |
| **Total** | **139** | **CONFIRMED** (13 + 121 + 5 = 139 ✓) |

#### Sev 2

| Subcategory | Count | Status |
|---|---|---|
| (a) Open case, not In Progress | 2 | CONFIRMED |
| (b) Open case, In Progress | 63 | CONFIRMED |
| (c) No open cases | 2 | CONFIRMED |
| **Total** | **67** | **CONFIRMED** (2 + 63 + 2 = 67 ✓) |

#### Sev 3

| Subcategory | Count | Status |
|---|---|---|
| (a) Open case, not In Progress | 16 | CONFIRMED |
| (b) Open case, In Progress | 103 | CONFIRMED |
| (c) No open cases | 9 | CONFIRMED |
| **Total** | **128** | **CONFIRMED** (16 + 103 + 9 = 128 ✓) |

#### Sev 4

| Subcategory | Count | Status |
|---|---|---|
| (a) | UNKNOWN | UNRESOLVED |
| (b) | UNKNOWN | UNRESOLVED |
| (c) | UNKNOWN | UNRESOLVED |
| **Total** | **123** | **CONFIRMED** |

**Note:** Only two sub-values are partially visible for Sev 4 in the screenshots: `9` and `123`. It is NOT confirmed whether Sev 4 follows the same (a)/(b)/(c) model.

### Cross-Level Totals

| Subcategory | Sev 1 | Sev 2 | Sev 3 | Total | Confirmed KPI |
|---|---|---|---|---|---|
| (a) | 13 | 2 | 16 | **31** | Sev 1/2/3 (a) = 31 ✓ |
| (b) | 121 | 63 | 103 | **287** | Sev 1/2/3 (b) = 287 ✓ |
| (c) | 5 | 2 | 9 | **16** | Sev 1/2/3 (c) = 16 ✓ |
| **Total** | **139** | **67** | **128** | **334** | #Sites in Sev 1/2/3 = 334 ✓ |

**All reconciliation checks pass.**

---

## 3. Site Table Data Contract (Open Cases / No Open Cases)

### Open Cases Table

**Purpose:** Site-level view of sites with ≥1 open SFDC case.

**Confirmed row count:** 526 (Screenshot 2)

**Status: CONFIRMED** — directly maps to Screenshot 2 "C&I Sites & SFDC OPEN Cases Only"

### No Open Cases Table

**Purpose:** Severity sites with zero open cases — proactive case creation candidates.

**Confirmed row count:** 16 (Screenshot 2)

**Status: CONFIRMED** — directly maps to Screenshot 2 "C&I Sites & SFDC NO OPEN Cases"

### Confirmed Site Table Columns

| # | Column | Data Type | Source | Site/Case/Derived | Status |
|---|---|---|---|---|---|
| 1 | Site Id | String (numeric) | Incorta | Site | CONFIRMED |
| 2 | Site Name | String | Incorta | Site | CONFIRMED |
| 3 | Site Stage | Enum | Incorta | Site | CONFIRMED |
| 4 | Site Status | Enum | Incorta | Site | CONFIRMED |
| 5 | Last Interval End Date (PST) | Datetime | Incorta | Site | CONFIRMED |
| 6 | Micro Count | Integer | Incorta | Site | CONFIRMED |
| 7 | Envoy Count | Integer | Incorta | Site | CONFIRMED |
| 8 | MI Product Sku | String | Incorta | Site | CONFIRMED |
| 9 | Envoy Types | String | Incorta | Site | CONFIRMED |
| 10 | Installer Name | String | Incorta | Site | CONFIRMED |
| 11 | State | String | Incorta | Site | CONFIRMED |
| 12 | Country | String | Incorta | Site | CONFIRMED |

### Fields with Multi-Case Ambiguity

When a site has multiple open cases with different attributes, these fields are unambiguous because they are site-level (not case-derived):

- Site Id, Site Name, Site Stage, Site Status, Last Interval End Date, Micro Count, Envoy Count, MI Product Sku, Envoy Types, Installer Name, State, Country

The following are case-derived attributes that may be ambiguous at site level:

| Attribute | Ambiguity | Status |
|---|---|---|
| Severity level | Set at site level, not per-case | INFERRED — appears to be a site attribute |
| Severity subcategory | Derived from case status — unclear aggregation rule for multiple cases | UNRESOLVED |
| `hasOpenCase` | Boolean — if any case is open, this is true | INFERRED |

---

## 4. Case Tracker Data Contract

### Confirmed 12-Column Structure

| # | Column | Internal Field | Data Type | Nullable | Unique | Site/Case Attr | Derived | Source Mapping | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Case Number | `caseNumber` | String (8-digit numeric) | No | Yes (assumed) | Case | No | UNKNOWN — source mapping required | CONFIRMED |
| 2 | Site Id | `siteId` | String (numeric) | No | No | Site | No | UNKNOWN — source mapping required | CONFIRMED |
| 3 | Site Link | `siteLink` | String (numeric) | No | No | Site (display) | Yes — equals siteId | UNKNOWN — source mapping required | CONFIRMED |
| 4 | Site Name | `siteName` | String | No | No | Site | No | UNKNOWN — source mapping required | CONFIRMED |
| 5 | Site Status | `siteStatus` | Enum | No | No | Site | No | UNKNOWN — source mapping required | CONFIRMED |
| 6 | Last Interval End Date (PST) | `lastIntervalEndDate` | Datetime string | No | No | Site | No | UNKNOWN — source mapping required | CONFIRMED |
| 7 | MI Product Sku | `miProductSku` | String | No | No | Site | No | UNKNOWN — source mapping required | CONFIRMED |
| 8 | Connection Type | `connectionType` | Enum | No | No | Site | No | UNKNOWN — source mapping required | CONFIRMED |
| 9 | Case Status | `caseStatus` | Enum | No | No | Case | No | UNKNOWN — source mapping required | CONFIRMED |
| 10 | Severity | `severity` | Composite string | No | No | Derived | Yes — `{level}({subcategory})` | UNKNOWN — source mapping required | CONFIRMED |
| 11 | Case Category | `caseCategory` | Enum | No | No | Case | No | UNKNOWN — source mapping required | CONFIRMED |
| 12 | Case Type | `caseType` | String | No | No | Case | No | UNKNOWN — source mapping required | CONFIRMED |

### Confirmed Reference Row Count

583 rows (CONFIRMED from Screenshot 3).

### Case Category Values

| Value | Status |
|---|---|
| Microinverter | CONFIRMED |
| Envoy | INFERRED (mock only — not confirmed from screenshots) |
| Meter | INFERRED (mock only — not confirmed from screenshots) |
| Other | INFERRED (mock only — not confirmed from screenshots) |

### Case Type Values

| Value | Status |
|---|---|
| MI. Drop Out | CONFIRMED |
| MI. AC Branch Issue | CONFIRMED |
| MI. Low Power | INFERRED (mock only — not confirmed from screenshots) |
| Envoy. Not Reporting | INFERRED (mock only — not confirmed from screenshots) |
| Meter. Issue | INFERRED (mock only — not confirmed from screenshots) |

---

## 5. Historical Data Contract

### Production Contract

| Field | Internal Name | Data Type | Status |
|---|---|---|---|
| Date | `date` | Date string (YYYY-MM-DD) | CONFIRMED |
| Installer | `installer` | String | CONFIRMED |
| Sev-1 Sites | `sev1` | Integer (≥0) | CONFIRMED |
| Sev-2 Sites | `sev2` | Integer (≥0) | CONFIRMED |
| Sev-3 Sites | `sev3` | Integer (≥0) | CONFIRMED |
| Total | `total` | Integer (≥0) | CONFIRMED |

### Business Rules

| Rule | Value | Status |
|---|---|---|
| Grain | One row per installer per date | CONFIRMED |
| Total calculation | `total = sev1 + sev2 + sev3` | CONFIRMED |
| Sev-4 included | **No** — absent from historical columns | CONFIRMED |
| "No Severity" included | **No** | INFERRED |
| Data start date | 2025-05-27 | CONFIRMED |
| Daily snapshots vs events | Assumed snapshots | UNRESOLVED |
| Date timezone | Unknown | UNRESOLVED |
| Weekend/gap handling | Some dates missing (e.g., 2026-08-30) | CONFIRMED — gaps exist |
| Reference row count | 497 (screenshot) | CONFIRMED as reference only — not production count |

### Mock vs Production

| Aspect | Mock | Production |
|---|---|---|
| Row count | ~8,400 (20 installers × ~420 dates) | UNKNOWN |
| Installer count | 20 | UNKNOWN |
| Date range | 2025-05-27 to 2026-09-01 | 2025-05-27 to present |
| Values | Random (seeded) | Real daily snapshots |
| Sunday gaps | Skipped by mock generator | UNKNOWN — real gap pattern unknown |

---

## 6. Filter Data Contract

### Confirmed Filters

| Filter | Internal Field | Control Type | Multi-value | Array Type | Status |
|---|---|---|---|---|---|
| Connection Type | `connectionType` | IN-style multi-select | Yes | `ConnectionType[]` | CONFIRMED |
| Site Stage Id | `siteStage` | IN-style multi-select | Yes | `SiteStage[]` | CONFIRMED |
| SKU | `miProductSku` | IN-style multi-select | Yes | `string[]` | CONFIRMED |

### Architecture

The current `DashboardFilters` interface already uses array types for all filter fields, supporting multi-value IN-style filtering:

```typescript
interface DashboardFilters {
  severity?: SeverityLevel[];
  siteStage?: SiteStage[];
  connectionType?: ConnectionType[];
  miProductSku?: string[];
  searchTerm?: string;
}
```

The data layer (`MockDataProvider.getSites()`) filters using `Array.includes()`, which correctly implements IN semantics.

### Confirmed Filter Behavior

| Behavior | Status |
|---|---|
| Filters appear as removable chips with × buttons | CONFIRMED |
| "Clear All" link in top-right to reset filters | CONFIRMED |
| Filters use IN operator (multi-select) | CONFIRMED |
| SKU filter displayed as descriptive text (not chip) | CONFIRMED |

### Recommended (NOT Confirmed) Additional Filters

| Filter | Field | Status |
|---|---|---|
| Severity | `severity` | RECOMMENDED — present in types but not confirmed as a UI filter |
| Site Status | (not in DashboardFilters) | RECOMMENDED |
| Installer | `installerName` | RECOMMENDED |
| State/Country | `state`, `country` | RECOMMENDED |
| Date Range | (not in DashboardFilters) | RECOMMENDED — for historical page |

These are NOT confirmed from screenshots and should not be added without stakeholder approval.

---

## 7. Source-to-Dashboard Data Mapping

### Site Fields

| Source Field | Internal Field | Dashboard Usage | Transformation | Status |
|---|---|---|---|---|
| UNKNOWN — source mapping required | `siteId` | Site identifier, table column, link target | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `siteName` | Table column, detail view | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `siteStage` | Table column, filter | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `siteStatus` | Table column, badge display, charts | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `lastIntervalEndDate` | Table column, detail view | Display in PST | CONFIRMED |
| UNKNOWN — source mapping required | `microCount` | Table column, detail view | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `envoyCount` | Table column, detail view | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `miProductSku` | Table column, filter | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `envoyType` | Table column, detail view | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `installerName` | Table column, historical grouping | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `state` | Table column, detail view | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `country` | Table column, detail view | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `connectionType` | Table column, filter | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `severity` | KPIs, badges, distribution | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `severitySubcategory` | KPIs, badges, composite string | Derived from case status? | UNRESOLVED |
| UNKNOWN — source mapping required | `invProduced` | Detail view (Sev overview only) | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `invParamBld` | Detail view (Sev overview only) | None expected | CONFIRMED |
| UNKNOWN — derived | `hasOpenCase` | Open Cases page split | Boolean: ≥1 open case → true | INFERRED |

### Case Fields

| Source Field | Internal Field | Dashboard Usage | Transformation | Status |
|---|---|---|---|---|
| UNKNOWN — source mapping required | `caseNumber` | Case Tracker column | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `siteId` | Case Tracker column, join key | None expected | CONFIRMED |
| UNKNOWN — derived | `siteLink` | Case Tracker clickable link | Equals siteId | CONFIRMED |
| UNKNOWN — source mapping required | `siteName` | Case Tracker column | Joined from site data | CONFIRMED |
| UNKNOWN — source mapping required | `siteStatus` | Case Tracker column | Joined from site data | CONFIRMED |
| UNKNOWN — source mapping required | `lastIntervalEndDate` | Case Tracker column | Joined from site data, PST | CONFIRMED |
| UNKNOWN — source mapping required | `miProductSku` | Case Tracker column | Joined from site data | CONFIRMED |
| UNKNOWN — source mapping required | `connectionType` | Case Tracker column | Joined from site data | CONFIRMED |
| UNKNOWN — source mapping required | `caseStatus` | Case Tracker column | None expected | CONFIRMED |
| UNKNOWN — derived | `severity` | Case Tracker column | Composite: `{level}({subcategory})` | CONFIRMED |
| UNKNOWN — source mapping required | `caseCategory` | Case Tracker column | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `caseType` | Case Tracker column | None expected | CONFIRMED |

### Historical Fields

| Source Field | Internal Field | Dashboard Usage | Transformation | Status |
|---|---|---|---|---|
| UNKNOWN — source mapping required | `date` | Pivot table date columns, trend chart X-axis | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `installer` | Pivot table rows | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `sev1` | Pivot sub-column, trend line | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `sev2` | Pivot sub-column, trend line | None expected | CONFIRMED |
| UNKNOWN — source mapping required | `sev3` | Pivot sub-column, trend line | None expected | CONFIRMED |
| UNKNOWN — derived or source | `total` | Pivot sub-column, trend line | `sev1 + sev2 + sev3` | CONFIRMED |

---

## 8. Data Relationship Model

```
SITE (siteId PK)
  |
  | 1:N
  v
CASE (caseNumber PK, siteId FK)
  - One site may have zero, one, or multiple cases
  - Each case belongs to exactly one site
  - Relationship confirmed from Case Tracker showing siteId per case
  - STATUS: CONFIRMED

SITE (siteId PK)
  |
  | N:1
  v
INSTALLER (installerName)
  - One site has one installer
  - One installer may have many sites
  - Join key: installerName (no installer ID confirmed)
  - STATUS: INFERRED — no formal installer entity confirmed

SITE (siteId PK)
  |
  | has current
  v
SEVERITY (level: 1|2|3|4|null, subcategory: a|b|c|null)
  - Each site has at most one severity level at a time
  - Subcategory derived from case status relationship
  - STATUS: severity level = CONFIRMED; subcategory derivation = INFERRED

HISTORICAL SEVERITY (date + installer = composite key)
  |
  | grouped by
  v
INSTALLER × DATE
  - One row per installer per date
  - Aggregates severity site counts for that installer on that date
  - STATUS: CONFIRMED

SITE → SEVERITY SUBCATEGORY derivation:
  (a) = site.hasOpenCase AND no case is 'Case - In Progress' (all are 'New')
  (b) = site.hasOpenCase AND ≥1 case is 'Case - In Progress'
  (c) = NOT site.hasOpenCase
  - STATUS: INFERRED — multi-case priority rule UNRESOLVED
```

### Relationship Observations

| Relationship | Evidence | Status |
|---|---|---|
| Site 1:N Case | 583 cases for 526 sites → some sites have multiple cases | CONFIRMED |
| Site N:1 Installer | Each site row shows one installer name | INFERRED |
| Severity is site-level, not case-level | Severity shown in site table, not just case tracker | INFERRED |
| Subcategory depends on case existence/status | (a)/(b)/(c) defined relative to open case status | CONFIRMED |
| Historical is per-installer-per-date | Pivot table structure confirms this | CONFIRMED |
| Cases are linked to sites via siteId | Case Tracker shows siteId column | CONFIRMED |

### Unconfirmed Relationships

- Whether a case can be associated with multiple sites — UNRESOLVED
- Whether installer has a separate entity table or is just a string attribute — UNRESOLVED
- How historical data links to the site/case model (snapshot vs. derived) — UNRESOLVED

---

## 9. Business-Rule Gaps

| # | Gap | Description | Impact | Priority | Required Decision |
|---|---|---|---|---|---|
| 1 | Sev-4 subcategories | Does Sev 4 follow (a)/(b)/(c) breakdown? Only partially visible in screenshots. | KPI display, severity breakdown section | P1 | Stakeholder confirmation |
| 2 | No Severity definition | 1,603 sites not in Sev 1–4. Are they healthy, unassessed, or excluded by algorithm? | Overview totals, filtering, whether to display | P0 | Business owner definition |
| 3 | No Severity in UI | Should "No Severity" appear as a visible category anywhere? | Page design, KPI presentation | P1 | Stakeholder decision |
| 4 | Percentage denominators | Confirmed as Total C&I Sites (2,060). But does the denominator change when filters are applied? | KPI calculations under filters | P1 | Verify with filtered screenshots |
| 5 | Severity assignment rules | How is severity level (1–4) calculated or assigned to a site? | Core business logic for production | P0 | Source system documentation |
| 6 | Open case determination | Which SFDC statuses qualify as "open"? Are New and Case - In Progress the only ones? | Open Cases page, subcategory calculation | P0 | SFDC configuration review |
| 7 | Multi-case aggregation | When a site has cases with different statuses (New + In Progress), which subcategory applies? | Subcategory accuracy | P1 | Business rule definition |
| 8 | Historical snapshot definition | Are values daily snapshots (count at end of day) or event-based? | Historical data interpretation | P1 | Source system documentation |
| 9 | Historical timezone | What timezone are historical dates in? PST? UTC? | Display accuracy | P2 | Source system documentation |
| 10 | Sev-4 in historical data | Why is Sev-4 excluded from historical tracking? By design? | Historical completeness | P2 | Business owner clarification |
| 11 | No Severity in historical | Should "No Severity" sites be tracked historically? | Historical completeness | P2 | Business owner decision |
| 12 | KPI/subcategory cross-filtering | Should clicking a KPI or subcategory filter the tables below? | UX interaction design | P2 | Stakeholder decision |
| 13 | Date range behavior | How should date range filtering work for historical data? | Historical page UX | P2 | UX design decision |
| 14 | Narrow-screen column priorities | Which columns should be hidden first at narrow resolutions? | Responsive design | P2 | Stakeholder input |
| 15 | Case Category completeness | Only "Microinverter" confirmed. What other categories exist? | Filter design, case tracker | P1 | SFDC review |
| 16 | Case Type completeness | Only "MI. Drop Out" and "MI. AC Branch Issue" confirmed. | Filter design, case tracker | P1 | SFDC review |
| 17 | Site Status exhaustiveness | Are the 5 confirmed statuses the complete set? | Type safety, filter design | P1 | Source system review |
| 18 | Site Status mutual exclusivity | Can a site have multiple simultaneous status conditions? | Data model, display logic | P1 | Source system review |
