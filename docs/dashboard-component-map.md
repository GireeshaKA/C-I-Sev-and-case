# Dashboard Component Map – C&I Severity and Cases

> Maps the expected dashboard UI components, their purpose, inputs, outputs, interactions, and dependencies.

---

## 1. KPI Cards

**Purpose:** Display summary metrics as prominent card elements at the top of the dashboard.

| Attribute | Detail |
|---|---|
| **Inputs** | `DashboardKpis` object from DataProvider |
| **Outputs** | Rendered KPI card elements |
| **Interactions** | Click on a KPI card may filter the dashboard to the relevant subset (e.g., clicking "Open Cases" filters to open cases) |
| **Dependencies** | DataProvider, DashboardFilters (global filters affect KPI values) |

**Sub-components:**
- `KpiCard` — Single metric card with label, value, optional trend indicator

---

## 2. Severity Distribution

**Purpose:** Visualize the distribution of severity levels across sites.

| Attribute | Detail |
|---|---|
| **Inputs** | `SeverityDistribution[]` from DataProvider |
| **Outputs** | Chart (bar or donut) showing severity counts/percentages |
| **Interactions** | Click on a severity segment to filter dashboard by that severity level |
| **Dependencies** | DataProvider, DashboardFilters, charting library (Recharts planned) |

**Sub-components:**
- `SeverityChart` — The chart visualization
- `SeverityLegend` — Color-coded legend for severity levels

---

## 3. Site Status Distribution

**Purpose:** Visualize the distribution of site operational statuses.

| Attribute | Detail |
|---|---|
| **Inputs** | `Site[]` from DataProvider (aggregated by status) |
| **Outputs** | Chart (bar or donut) showing status counts |
| **Interactions** | Click on a status segment to filter dashboard by that status |
| **Dependencies** | DataProvider, DashboardFilters, charting library |

---

## 4. Open Cases Analysis

**Purpose:** Display and analyze currently open cases.

| Attribute | Detail |
|---|---|
| **Inputs** | `SfdcCase[]` (filtered to open status) from DataProvider |
| **Outputs** | Data table with sortable columns, summary statistics |
| **Interactions** | Sort by column, filter within table, click row to drill down to Case Detail |
| **Dependencies** | DataProvider, DashboardFilters, table library (TanStack Table planned) |

**Sub-components:**
- `CaseTable` — Reusable table component for case data
- `CaseSummaryBar` — Summary counts above the table (e.g., by severity)

---

## 5. Case Tracker

**Purpose:** Comprehensive case tracking view with all cases (open and closed).

| Attribute | Detail |
|---|---|
| **Inputs** | `SfdcCase[]` (all cases) from DataProvider |
| **Outputs** | Full-featured data table with advanced filtering and sorting |
| **Interactions** | Sort, filter, search, paginate, click row to drill down to Case Detail |
| **Dependencies** | DataProvider, DashboardFilters, table library |

**Sub-components:**
- `CaseTable` — Shared with Open Cases Analysis
- `CaseFilterBar` — Case-specific filters (status, category, type, date range)

---

## 6. Historical Severity Trend

**Purpose:** Show how severity distribution changes over time.

| Attribute | Detail |
|---|---|
| **Inputs** | `HistoricalSeverity[]` from DataProvider |
| **Outputs** | Time-series chart (stacked area or line) |
| **Interactions** | Hover for tooltip with date-specific values, date range selection, toggle severity levels on/off |
| **Dependencies** | DataProvider, DashboardFilters, charting library |

**Sub-components:**
- `SeverityTrendChart` — The time-series visualization
- `DateRangeSelector` — Date range picker for the chart

---

## 7. Global Filter Bar

**Purpose:** Provide dashboard-wide filtering controls.

| Attribute | Detail |
|---|---|
| **Inputs** | Filter options from DataProvider (`getFilterOptions`), current `DashboardFilters` state |
| **Outputs** | Updated `DashboardFilters` state (dispatched via context) |
| **Interactions** | Multi-select dropdowns, date pickers, search input, clear/reset button |
| **Dependencies** | DataProvider (for filter option values), filter state context |

**Sub-components:**
- `MultiSelectFilter` — Reusable multi-select dropdown
- `DateRangeFilter` — Date range picker
- `SearchFilter` — Free-text search input
- `FilterResetButton` — Clear all filters

---

## 8. Site Detail

**Purpose:** Detailed view of a single site for investigation.

| Attribute | Detail |
|---|---|
| **Inputs** | `Site` from DataProvider (`getSiteById`), `SfdcCase[]` from DataProvider (`getCasesBySiteId`) |
| **Outputs** | Site summary panel, associated cases table, site severity history (future) |
| **Interactions** | Navigate back to site list, click case row to drill down to Case Detail |
| **Dependencies** | DataProvider, routing (site ID in URL) |

**Sub-components:**
- `SiteInfoPanel` — Site summary information
- `SiteCasesTable` — Table of cases for this site
- `SiteSeverityHistory` — Historical severity for this site (future)

---

## 9. Case Detail

**Purpose:** Detailed view of a single case for investigation.

| Attribute | Detail |
|---|---|
| **Inputs** | `SfdcCase` from DataProvider (`getCaseByNumber`) |
| **Outputs** | Case summary panel, associated site link, timeline |
| **Interactions** | Navigate back to case list, click site link to drill down to Site Detail |
| **Dependencies** | DataProvider, routing (case number in URL) |

**Sub-components:**
- `CaseInfoPanel` — Case summary information
- `CaseTimeline` — Created, modified, closed dates

---

## Component Dependency Graph

```
App
├── GlobalFilterBar
│   ├── MultiSelectFilter
│   ├── DateRangeFilter
│   ├── SearchFilter
│   └── FilterResetButton
│
├── OverviewPage
│   ├── KpiCards
│   │   └── KpiCard (×N)
│   ├── SeverityDistribution
│   │   ├── SeverityChart
│   │   └── SeverityLegend
│   └── SiteStatusDistribution
│
├── SiteHealthPage
│   ├── SiteTable
│   └── SiteDetail
│       ├── SiteInfoPanel
│       ├── SiteCasesTable
│       └── SiteSeverityHistory
│
├── OpenCasesPage
│   ├── CaseSummaryBar
│   └── CaseTable
│
├── CaseTrackerPage
│   ├── CaseFilterBar
│   └── CaseTable
│
├── HistoricalTrendsPage
│   ├── DateRangeSelector
│   └── SeverityTrendChart
│
└── CaseDetail
    ├── CaseInfoPanel
    └── CaseTimeline
```
