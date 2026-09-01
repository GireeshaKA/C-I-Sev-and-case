# Dashboard Component Map – C&I Severity and Cases

> Updated based on Phase 1 screenshot analysis.
> Classification: **CONFIRMED** = maps directly to Incorta element | **RECOMMENDED** = new/improved element not in Incorta

---

## 1. KPI Cards — Primary Row

**Purpose:** Display primary summary KPIs: Total Sites, %Sev 1/2/3, #Sev 1/2/3, sub-categories (a/b/c), Sev 4 stats.

| Attribute | Detail |
|---|---|
| **Inputs** | Aggregated site counts by severity and sub-category from DataProvider |
| **Outputs** | Row of 8 KPI cards with values and labels |
| **Interactions** | RECOMMENDED: Click to filter dashboard by severity level or sub-category |
| **Dependencies** | DataProvider, DashboardFilters |
| **Confidence** | CONFIRMED — directly maps to Screenshot 1 KPI row 1 |

**Sub-components:**
- `KpiCard` — Value + label + optional sub-label

---

## 2. KPI Cards — Percentage Row

**Purpose:** Display per-severity percentage KPIs.

| Attribute | Detail |
|---|---|
| **Inputs** | Site counts per severity level, total site count |
| **Outputs** | Row of percentage KPIs: %Sev1, %Sev2, %Sev3, %Sev4 |
| **Interactions** | RECOMMENDED: Click to filter |
| **Dependencies** | DataProvider, DashboardFilters |
| **Confidence** | CONFIRMED — directly maps to Screenshot 1 KPI row 2 (orange text) |

---

## 3. Severity Breakdown Panel

**Purpose:** Show per-severity-level counts with (a)/(b)/(c) sub-category breakdown.

| Attribute | Detail |
|---|---|
| **Inputs** | Site counts grouped by severity level and sub-category |
| **Outputs** | Panel showing Sev 1/2/3/4 sections, each with Total, (a), (b), (c) counts |
| **Interactions** | RECOMMENDED: Click sub-category to filter to those sites |
| **Dependencies** | DataProvider, DashboardFilters |
| **Confidence** | CONFIRMED — directly maps to Screenshot 1 severity sections |

**Sub-components:**
- `SeverityLevelCard` — One card per severity level with sub-category breakdown

---

## 4. Severity Distribution Chart (RECOMMENDED)

**Purpose:** Visualize severity distribution as a chart. NOT in Incorta (all numeric), but recommended for better UX.

| Attribute | Detail |
|---|---|
| **Inputs** | Severity counts from DataProvider |
| **Outputs** | Donut or horizontal bar chart with color-coded segments |
| **Interactions** | Click segment to filter, hover for tooltip |
| **Dependencies** | Charting library (Recharts), DataProvider |
| **Confidence** | RECOMMENDED — Incorta shows only numbers; chart adds visual clarity |

---

## 5. Site Table (Severity Overview)

**Purpose:** Display site-level data with severity information.

| Attribute | Detail |
|---|---|
| **Inputs** | Site[] from DataProvider |
| **Outputs** | Sortable, filterable data table |
| **Columns** | Site Id, Site Name, Site Stage, Site Status, Last Interval End Date (PST), Micro Count, Inv Produced, Inv ParamBld, Envoy Count, MI Product Sku, Envoy Types |
| **Interactions** | Column sort, row click for site detail |
| **Dependencies** | DataProvider, DashboardFilters, TanStack Table |
| **Confidence** | CONFIRMED — directly maps to Screenshot 1 site table |

---

## 6. Open Cases Site Table

**Purpose:** Show sites that have at least one open SFDC case.

| Attribute | Detail |
|---|---|
| **Inputs** | Sites with open cases from DataProvider |
| **Outputs** | Site-level table (NOT case-level) |
| **Columns** | Site Id, Site Name, Site Stage, Site Status, Last Interval End Date (PST), Micro count, Envoy Count, MI Product Sku, Envoy Types, Installer Name, State, Country |
| **Interactions** | Column sort, row click for site detail |
| **Dependencies** | DataProvider, DashboardFilters, TanStack Table |
| **Row count** | 526 (example) |
| **Confidence** | CONFIRMED — directly maps to Screenshot 2 "SFDC OPEN Cases Only" |

---

## 7. No Open Cases Site Table

**Purpose:** Show severity sites that do NOT have an open SFDC case (action list for proactive case creation).

| Attribute | Detail |
|---|---|
| **Inputs** | Severity sites without open cases from DataProvider |
| **Outputs** | Site-level table with same columns as Open Cases table |
| **Columns** | Same as Open Cases Site Table |
| **Interactions** | Column sort, row click for site detail |
| **Dependencies** | DataProvider, DashboardFilters, TanStack Table |
| **Row count** | 16 (example) |
| **Confidence** | CONFIRMED — directly maps to Screenshot 2 "SFDC NO OPEN Cases" |

---

## 8. Case Tracker Table

**Purpose:** Case-level tracking with full site and case details.

| Attribute | Detail |
|---|---|
| **Inputs** | Cases with linked site data from DataProvider |
| **Outputs** | Case-level data table with 12 columns |
| **Columns** | Case Number, Site Id, Site Link, Site Name, Site Status, Last Interval End Date (PST), MI Product Sku, Connection Type, Case Status, Severity, Case Category, Case Type |
| **Interactions** | Column sort, Site Link click → site detail, Case Number click → case detail / SFDC |
| **Dependencies** | DataProvider, DashboardFilters, TanStack Table |
| **Row count** | 583 (example) |
| **Confidence** | CONFIRMED — directly maps to Screenshot 3 "C&I Sites Case Tracker" |

---

## 9. Historical Data Pivot Table

**Purpose:** Show severity counts per installer over time in a pivot-table format.

| Attribute | Detail |
|---|---|
| **Inputs** | Historical severity data grouped by installer and date from DataProvider |
| **Outputs** | Pivot table with date-grouped columns and severity sub-columns |
| **Column groups** | Per date: Sev-1 Sites, Sev-2 Sites, Sev-3 Sites, Total |
| **Rows** | One per installer, with totals row |
| **Interactions** | Horizontal scroll for date columns, column sort |
| **Dependencies** | DataProvider, DashboardFilters, TanStack Table (or custom pivot) |
| **Row count** | 497 (example) |
| **Confidence** | CONFIRMED — directly maps to Screenshot 3 "Historical Data per Installer" |

---

## 10. Historical Severity Trend Chart (RECOMMENDED)

**Purpose:** Visualize historical severity trends as a time-series chart. NOT in Incorta.

| Attribute | Detail |
|---|---|
| **Inputs** | Historical severity data from DataProvider |
| **Outputs** | Stacked area or line chart showing Sev-1/2/3 over time |
| **Interactions** | Hover for tooltip, date range selection, toggle series |
| **Dependencies** | Charting library (Recharts), DataProvider |
| **Confidence** | RECOMMENDED — adds visual trend analysis not available in Incorta's table-only format |

---

## 11. Global Filter Bar

**Purpose:** Dashboard-wide filtering controls.

| Attribute | Detail |
|---|---|
| **Inputs** | Filter options from DataProvider, current filter state |
| **Outputs** | Updated filter state applied across all components |
| **Controls** | Multi-select dropdowns for Connection Type, Site Stage, SKU, Severity, Status |
| **Display** | Active filters shown as removable chips with × button |
| **Reset** | "Clear All" button |
| **Dependencies** | Filter state context, DataProvider |
| **Confidence** | CONFIRMED — filter chips and Clear All visible in Screenshot 1 |

**Sub-components:**
- `FilterChip` — Removable filter chip
- `MultiSelectDropdown` — Dropdown with search and multi-select
- `ClearAllButton` — Reset all filters

---

## 12. SKU Filter Label

**Purpose:** Display the active SKU scope as a text label below KPIs and above tables.

| Attribute | Detail |
|---|---|
| **Inputs** | Active SKU filter values |
| **Outputs** | Text label: "C&I Sites with SKU [list]" |
| **Confidence** | CONFIRMED — visible in all three screenshots as descriptive text |

---

## 13. Navigation Sidebar

**Purpose:** Navigate between dashboard pages.

| Attribute | Detail |
|---|---|
| **Items** | Overview, Site Health, Open Cases, Case Tracker, Historical Trends |
| **Style** | Left sidebar, collapsible, active item highlighted orange |
| **Confidence** | RECOMMENDED — Incorta uses tabs within a single page; new dashboard separates into pages |

---

## Component Dependency Graph

```
App
├── NavigationSidebar                        [RECOMMENDED]
├── GlobalFilterBar                          [CONFIRMED]
│   ├── MultiSelectDropdown
│   ├── FilterChip (×N)
│   └── ClearAllButton
│
├── OverviewPage
│   ├── KpiCardsRow1                         [CONFIRMED]
│   │   └── KpiCard (×8)
│   ├── SeverityBreakdownPanel               [CONFIRMED]
│   │   └── SeverityLevelCard (×4)
│   ├── KpiCardsRow2 (percentages)           [CONFIRMED]
│   ├── SkuFilterLabel                       [CONFIRMED]
│   ├── SeverityDistributionChart            [RECOMMENDED]
│   └── SiteTable                            [CONFIRMED]
│
├── OpenCasesPage
│   ├── OpenCasesSiteTable                   [CONFIRMED]
│   └── NoOpenCasesSiteTable                 [CONFIRMED]
│
├── CaseTrackerPage
│   └── CaseTrackerTable                     [CONFIRMED]
│
├── HistoricalTrendsPage
│   ├── HistoricalSeverityTrendChart         [RECOMMENDED]
│   └── HistoricalPivotTable                 [CONFIRMED]
│
└── SiteDetailPage                           [INFERRED]
    ├── SiteInfoPanel
    └── SiteCasesTable
```
