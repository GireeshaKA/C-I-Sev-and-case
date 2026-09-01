# UI/UX Specification – C&I Severity and Cases Dashboard

> Visual and interaction design direction for the new web dashboard.
> Based on Incorta screenshot analysis. Goal: modern enterprise analytics dashboard
> inspired by—but not cloning—the existing Incorta dashboard.

---

## 1. Visual Design Analysis of Existing Incorta Dashboard

### Layout
- **Single-page scrolling layout** — all content on one vertically scrolling page within a tab
- **No card-based layout** — content flows as sections with headers, KPI rows, and full-width tables
- **Dense information layout** — minimal spacing between sections
- **Left sidebar navigation** — persistent, narrow sidebar with icons + labels

### Typography
- **KPI values:** Large bold numbers (primary KPIs in dark text, secondary row in orange)
- **KPI labels:** Small text below values
- **Table headers:** White text on orange background
- **Table body:** Standard-size regular text, dark color
- **Section titles:** Bold, left-aligned, standard size
- **Notes text:** Small, dark, indented

### Colors
- **Primary accent:** Enphase orange (approximately `#F37421` or similar)
- **Table header background:** Orange
- **Table header text:** White
- **Table row alternation:** Not clearly visible (appears white/very light)
- **KPI secondary row text:** Orange
- **Section separators:** Orange horizontal line
- **Sidebar active item:** Orange text
- **Body text:** Dark gray/black
- **Background:** White

### Tables
- **Full-width tables** spanning the content area
- **Orange header row** with white text
- **Row separator lines** visible
- **Row count displayed** at bottom-right (e.g., "Displaying 526 row(s)")
- **No visible pagination controls** — appears to show all rows
- **Historical table:** Complex pivot-table with grouped date columns and severity sub-columns

### Charts
- **No charts visible** in any of the three screenshots. All data is presented as KPI numbers and tables.

### Navigation
- **Left sidebar:** Home, Content (active), Scheduler, Marketplace, Help, Account
- **Tab bar:** Horizontal tabs below header for sub-sections
- **Active tab indicator:** Caret (∧) symbol
- **Breadcrumb:** "Content / C&I Sites" at top

### Filter Placement
- **Below page header, above tab bar:** Filter chips displayed horizontally
- **Removable chips:** Each filter shows as a pill with × button
- **Clear All:** Link at far right of filter bar

### Information Density
- **High density** — the dashboard prioritizes showing maximum data
- **Minimal whitespace** between sections
- **Tables dominate** the visual space
- **No decorative elements** — purely functional

---

## 2. Design Direction for New Dashboard

### Philosophy

> "Modern enterprise analytics dashboard with higher visual quality,
> better information hierarchy, and improved usability while preserving
> the information density of the Incorta original."

### Key Improvements Over Incorta

1. **Add graphical visualizations** — the Incorta dashboard has zero charts. Add severity distribution charts, site status charts, and historical trend charts.
2. **Better information hierarchy** — use card containers to group related KPIs, use visual weight to distinguish primary from secondary metrics.
3. **Dedicated pages** instead of vertical scroll — separate concerns into navigable pages for faster access.
4. **Responsive design** — Incorta tables require horizontal scrolling. New dashboard should handle this gracefully.
5. **Interactive charts** — severity breakdown is currently just numbers; present as clickable donut/bar charts.
6. **Better filter UX** — expand filter options, make them more discoverable.

### Color Palette

| Usage | Color | Hex |
|---|---|---|
| Primary accent | Enphase Orange | `#F37421` |
| Primary hover | Darker Orange | `#D4631D` |
| Severity 1 (Critical) | Red | `#DC2626` |
| Severity 2 (High) | Orange | `#EA580C` |
| Severity 3 (Medium) | Amber/Yellow | `#D97706` |
| Severity 4 (Low) | Blue | `#2563EB` |
| No Severity | Gray | `#6B7280` |
| Success / Normal | Green | `#16A34A` |
| Background | White | `#FFFFFF` |
| Surface / Cards | Light Gray | `#F9FAFB` |
| Border | Border Gray | `#E5E7EB` |
| Text Primary | Dark Gray | `#111827` |
| Text Secondary | Medium Gray | `#6B7280` |
| Text Tertiary | Light Gray | `#9CA3AF` |
| Table Header BG | Dark slate | `#1F2937` |
| Table Header Text | White | `#FFFFFF` |
| Table Row Hover | Very light orange | `#FFF7ED` |
| Table Row Alt | Very light gray | `#F9FAFB` |

### Typography Scale

| Element | Size | Weight | Color |
|---|---|---|---|
| Page title | 24px | Bold (700) | Text Primary |
| Section title | 18px | Semibold (600) | Text Primary |
| KPI value (large) | 32px | Bold (700) | Text Primary |
| KPI value (percentage) | 28px | Bold (700) | Primary Orange |
| KPI label | 12px | Medium (500) | Text Secondary |
| Table header | 13px | Semibold (600) | White |
| Table body | 13px | Regular (400) | Text Primary |
| Filter chip | 13px | Medium (500) | Text Primary |
| Navigation item | 14px | Medium (500) | Text Secondary |
| Navigation active | 14px | Semibold (600) | Primary Orange |

### Spacing

| Element | Value |
|---|---|
| Page padding | 24px |
| Section gap | 24px |
| Card padding | 16px |
| KPI card gap | 16px |
| Table cell padding | 8px 12px |
| Filter chip gap | 8px |
| Border radius (cards) | 8px |
| Border radius (chips) | 16px |

### Component Style Guidelines

- **Cards:** Subtle border (`1px solid #E5E7EB`), minimal shadow (`0 1px 3px rgba(0,0,0,0.1)`), 8px border radius
- **Tables:** Dense rows, subtle alternating row colors, strong header, horizontal scroll contained within card
- **Charts:** Clean, minimal gridlines, tooltips on hover, consistent color palette matching severity colors
- **Filters:** Pill-shaped chips, orange outline when active, × to remove, dropdown for selection
- **Navigation:** Left sidebar (collapsible), active item highlighted with orange accent
- **Buttons:** Minimal, text or outlined style, orange for primary actions

---

## 3. Responsive Breakpoints

### 1920×1080 (Full Desktop)

- Full sidebar visible with icons + labels
- KPI cards in single row (up to 8 across)
- Charts side-by-side (2-3 per row)
- Tables full width with all columns visible
- Filters in single horizontal row

### 1600×900

- Full sidebar
- KPI cards in single row (may wrap to 2 rows if >6)
- Charts 2 per row
- Tables may begin horizontal scrolling for wide tables (Case Tracker)
- Filters in single row

### 1440×900

- Sidebar may collapse to icon-only
- KPI cards wrap to 2 rows
- Charts stack to 1-2 per row
- Case Tracker table: contained horizontal scroll
- Filters may wrap to 2 rows

### 1366×768

- Sidebar collapsed to icons
- KPI cards in 2 rows
- Charts stack vertically (1 per row)
- All tables: contained horizontal scroll
- Filter chips wrap

### 1280×800

- Sidebar collapsed to icons
- KPI cards in 2 rows, smaller text
- Charts full width, stacked
- Tables: contained horizontal scroll, consider column priority (hide less important columns)
- Filters: collapsible filter panel with toggle button

### Table Responsive Rules

- **Page-level:** No horizontal scroll on the page body itself
- **Table containers:** Have their own horizontal scroll area with sticky first column (Site Id or Case Number)
- **Column priority:** Define which columns hide first at narrow widths
- **Row count badge:** Always visible at bottom of table

---

## 4. Interaction Patterns

### KPI Cards
- Hover: subtle elevation/shadow change
- Click on severity KPI → filter dashboard to that severity level
- Click on sub-category (a/b/c) KPI → filter to that case status subset

### Charts (RECOMMENDED — not in Incorta)
- Hover: tooltip with exact values
- Click segment: filter table below to that category
- Legend items: toggle visibility

### Tables
- Column header click: sort ascending → descending → no sort
- Sort indicator: arrow icon in header
- Row hover: highlight row
- Cell click (Site Link): navigate to site detail
- Cell click (Case Number): navigate to case detail (or external SFDC link)

### Filters
- Multi-select dropdowns with search
- Applied filters shown as removable chips
- Clear All button
- Filter count badge

### Navigation
- Sidebar items: click to navigate
- Active page highlighted
- Tab bar: if retained, click to switch sections

---

## 5. Textual Wireframes

### Page: Overview

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]  │  C&I – Severity and Cases                  │
│            │  ─────────────────────────────────────────  │
│  Overview  │  [Filter Bar: Connection Type × | Stage ×]  │
│  Site Hlth │  ─────────────────────────────────────────  │
│  Open Case │                                             │
│  Tracker   │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──────┐ │
│  History   │  │2,060│ │16.2%│ │ 334 │ │ 31  │ │ 287  │ │
│            │  │Total│ │Sev  │ │#Sev │ │(a)  │ │(b)   │ │
│            │  │Sites│ │1/2/3│ │1/2/3│ │     │ │      │ │
│            │  └─────┘ └─────┘ └─────┘ └─────┘ └──────┘ │
│            │  ┌─────┐ ┌─────┐ ┌─────┐                   │
│            │  │ 16  │ │6.0% │ │ 123 │                   │
│            │  │(c)  │ │Sev4 │ │#Sev4│                   │
│            │  └─────┘ └─────┘ └─────┘                   │
│            │                                             │
│            │  ┌──── Severity Distribution ─────────────┐ │
│            │  │                                        │ │
│            │  │  [Donut/Bar Chart: Sev1/2/3/4 counts]  │ │
│            │  │  Per-sev breakdown with (a)(b)(c) sub  │ │
│            │  │                                        │ │
│            │  └────────────────────────────────────────┘ │
│            │                                             │
│            │  ┌──── % by Severity Level ───────────────┐ │
│            │  │ %Sev1: 6.7% | %Sev2: 3.3% | %Sev3:   │ │
│            │  │ 6.2% | %Sev4: 6.0%                    │ │
│            │  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Page: Site Health (Sites with severity)

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Site Health                                │
│            │  [Filter Bar]                               │
│            │  ─────────────────────────────────────────  │
│            │  ┌── Site Table ─────────────────────────┐  │
│            │  │ SiteId | Name | Stage | Status |      │  │
│            │  │ LastInterval | Micro | Envoy | SKU |  │  │
│            │  │ EnvoyType | Inv | InvParam            │  │
│            │  │                                       │  │
│            │  │ [rows...]                             │  │
│            │  │                                       │  │
│            │  │          Displaying N row(s)          │  │
│            │  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Page: Open Cases

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Open Cases                                 │
│            │  [Filter Bar]                               │
│            │  ─────────────────────────────────────────  │
│            │  ┌── SFDC OPEN Cases ────────────────────┐  │
│            │  │ SiteId | Name | Stage | Status |      │  │
│            │  │ LastInterval | Micro | Envoy | SKU |  │  │
│            │  │ EnvoyType | Installer | State | Ctry  │  │
│            │  │                                       │  │
│            │  │ [526 rows...]                         │  │
│            │  │          Displaying 526 row(s)        │  │
│            │  └───────────────────────────────────────┘  │
│            │                                             │
│            │  ┌── SFDC NO OPEN Cases ─────────────────┐  │
│            │  │ SiteId | Name | Stage | Status |      │  │
│            │  │ [same columns as above]               │  │
│            │  │                                       │  │
│            │  │ [16 rows...]                          │  │
│            │  │          Displaying 16 row(s)         │  │
│            │  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Page: Case Tracker

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Case Tracker                               │
│            │  [Filter Bar]                               │
│            │  ─────────────────────────────────────────  │
│            │  ┌── Case Tracker Table ─────────────────┐  │
│            │  │ CaseNum | SiteId | SiteLink | Name |  │  │
│            │  │ Status | LastInterval | SKU | Conn |  │  │
│            │  │ CaseStatus | Severity | Category |    │  │
│            │  │ CaseType                              │  │
│            │  │                                       │  │
│            │  │ [583 rows...]                         │  │
│            │  │          Displaying 583 row(s)        │  │
│            │  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Page: Historical Trends

```
┌─────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Historical Trends                          │
│            │  [Filter Bar] [Date Range]                  │
│            │  ─────────────────────────────────────────  │
│            │  ┌── Severity Trend Chart (RECOMMENDED) ─┐  │
│            │  │                                        │  │
│            │  │  [Stacked area/line chart]              │  │
│            │  │  X: dates  Y: site counts              │  │
│            │  │  Series: Sev-1, Sev-2, Sev-3           │  │
│            │  │                                        │  │
│            │  └────────────────────────────────────────┘  │
│            │                                             │
│            │  ┌── Historical Data per Installer ──────┐  │
│            │  │  Pivot table: rows=installer           │  │
│            │  │  cols=date groups × (Sev1,Sev2,Sev3,  │  │
│            │  │  Total)                                │  │
│            │  │                                        │  │
│            │  │ [497 rows...]                          │  │
│            │  │          Displaying 497 row(s)         │  │
│            │  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Cross-Filtering / Interaction Matrix

| Action | KPI Cards | Severity Section | Site Table | Open Cases Table | Case Tracker | Historical | Confidence |
|---|---|---|---|---|---|---|---|
| Select Severity Level | Update | Highlight | Filter | Filter | Filter | Filter | RECOMMENDED |
| Click sub-category (a/b/c) | Highlight | Highlight | Filter | Filter | Filter | — | RECOMMENDED |
| Select Site Status | Update | — | Filter | Filter | Filter | — | RECOMMENDED |
| Select Connection Type | Update | Update | Filter | Filter | Filter | Filter | CONFIRMED (filter chip exists) |
| Select Site Stage | Update | Update | Filter | Filter | Filter | Filter | CONFIRMED (filter chip exists) |
| Click Site Link in tracker | — | — | — | — | Navigate to site | — | INFERRED |
| Click Case Number | — | — | — | — | Navigate to case/SFDC | — | INFERRED |
| Date range change | — | — | — | — | — | Filter dates | RECOMMENDED |

---

## 7. Data Relationship Model

```
SITE (1)
  │
  ├──── SITE STAGE (M:1)     ← Ready, Final, Verifying
  │
  ├──── SITE STATUS (M:1)    ← Normal, Production Issue, Microinverters Not Reporting,
  │                             Envoy Not Reporting, Meter Issue
  │
  ├──── SEVERITY (M:1)       ← 1, 2, 3, 4, or none
  │       │
  │       └── SUB-CATEGORY   ← (a), (b), (c) — derived from case status
  │
  ├──── PRODUCT (M:1)        ← MI Product Sku
  │
  ├──── CONNECTION (M:1)     ← Ethernet, Wifi, Cellular
  │
  ├──── ENVOY TYPE (M:1)     ← IQD Commercial Gateway, IQ Gateway Commercial, etc.
  │
  ├──── LOCATION (M:1)       ← State + Country
  │
  ├──── INSTALLER (M:1)      ← Installer Name
  │
  └──── CASES (1:N)
          │
          ├── CASE STATUS     ← New, Case - In Progress
          ├── CASE SEVERITY   ← Composite: {level}({subcategory})
          ├── CASE CATEGORY   ← Microinverter, etc.
          └── CASE TYPE       ← MI. Drop Out, MI. AC Branch Issue, etc.

HISTORICAL SEVERITY
  │
  ├── DATE (daily snapshots)
  ├── INSTALLER (grouped by)
  └── SEVERITY COUNTS (Sev-1, Sev-2, Sev-3, Total per date per installer)
```

### Key Relationships

| Relationship | Type | Confidence |
|---|---|---|
| Site → Cases | One-to-Many | CONFIRMED (Site appears in both site tables and case tracker) |
| Site → Severity | Many-to-One | CONFIRMED (site has one severity level) |
| Severity → Sub-category | Derived | CONFIRMED (sub-category derived from case status presence) |
| Site → Installer | Many-to-One | CONFIRMED (historical data grouped by installer) |
| Site → Product SKU | Many-to-One | CONFIRMED |
| Case → Site | Many-to-One | CONFIRMED (case tracker has Site Id linking to site) |
| Historical → Installer × Date | Pivot | CONFIRMED |
