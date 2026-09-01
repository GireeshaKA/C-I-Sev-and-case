# Dashboard Requirements – C&I Severity and Cases

> Derived from the Incorta reference dashboard screenshots.
> Business rules marked with ⚠️ require confirmation from stakeholders.

---

## 1. KPI Section

**Purpose:** Provide at-a-glance summary metrics across all C&I sites.

**Expected KPIs:**
- **Total Sites** — Count of all C&I sites in scope
- **Open Cases** — Count of currently open SFDC cases
- **Critical Severity (S0/S1)** — Count of sites or cases at critical severity
- **Sites with Open Cases** — Count of sites that have at least one open case
- **Sites without Open Cases** — Count of sites with no open cases
- **Average Case Age** — Mean age (in days) of open cases

⚠️ Business rule requires confirmation: Exact KPI definitions, whether KPIs are site-based or case-based counts, and any additional KPIs expected.

---

## 2. Severity Section

**Purpose:** Display the distribution of severity levels across sites.

**Expected Content:**
- Severity distribution chart (bar or pie) showing counts by severity level (S0, S1, S2, S3, S4, No Severity)
- Percentage breakdown
- Ability to filter by severity level

⚠️ Business rule requires confirmation: Whether severity is assigned at site level, case level, or both. Whether a site's severity is the maximum severity of its open cases.

---

## 3. Site Status Section

**Purpose:** Display the distribution of site operational statuses.

**Expected Content:**
- Site status distribution (Normal, Warning, Critical, Offline, Unknown)
- Count and percentage per status
- Visual indicator (color-coded)

⚠️ Business rule requires confirmation: Exact definitions of each status and the rules that determine site status transitions.

---

## 4. Open Cases Section

**Purpose:** Show all currently open cases with relevant details.

**Expected Content:**
- Table of open cases with columns: Case Number, Site Name, Severity, Category, Type, Owner, Age, Priority, Status
- Sorting by any column
- Filtering by severity, category, type, status
- Pagination for large datasets

---

## 5. No-Open-Cases Section

**Purpose:** Identify sites that currently have no open cases (healthy sites).

**Expected Content:**
- List or table of sites with zero open cases
- Site details: Site ID, Site Name, Status, Last Interval End Date, Micro Count

⚠️ Business rule requires confirmation: Whether "no open cases" is the sole criterion for inclusion, or if additional health metrics apply.

---

## 6. Case Tracker

**Purpose:** Provide a comprehensive view of all cases (open and closed) for tracking and investigation.

**Expected Content:**
- Full case table with all fields: Case Number, Status, Severity, Category, Type, Site, Subject, Created Date, Closed Date, Owner, Age, Priority
- Sorting, filtering, and search
- Case detail drill-down
- Export capability (future)

---

## 7. Historical Severity Data

**Purpose:** Show severity trends over time to identify patterns and improvements.

**Expected Content:**
- Time-series chart (stacked area or line) showing severity distribution over time
- Date range selection
- Ability to view by week, month, or custom period

⚠️ Business rule requires confirmation: Data granularity (daily, weekly, monthly snapshots), retention period, and how historical severity is calculated (point-in-time snapshot vs. cumulative).

---

## 8. Filters

**Purpose:** Enable users to narrow the dashboard view to specific subsets of data.

**Expected Filters:**
- **Severity** — Multi-select (S0, S1, S2, S3, S4, No Severity)
- **Site Stage** — Multi-select (Active, Inactive, Decommissioned, Pending)
- **Site Status** — Multi-select (Normal, Warning, Critical, Offline, Unknown)
- **Connection Type** — Multi-select (Ethernet, WiFi, Cellular, Unknown)
- **Envoy Type** — Multi-select (IQ Gateway, IQ Gateway Commercial, Envoy-S, Unknown)
- **State** — Multi-select (US states)
- **Country** — Multi-select
- **Installer** — Multi-select
- **Case Status** — Multi-select (Open, Closed, Escalated, In Progress, Pending)
- **Case Category** — Multi-select (Performance, Communication, Hardware, Software, Grid, Other)
- **Case Type** — Multi-select (Reactive, Proactive, Customer Initiated)
- **Date Range** — Start and end date picker
- **Search** — Free-text search across site name, site ID, installer name

**Behavior:**
- Filters apply globally across all dashboard sections
- Filters are combinable (AND logic between filter groups)
- Filter selections persist during navigation between sections
- Clear all / reset filters option

---

## 9. Site-Level Drill-Down

**Purpose:** Allow users to investigate individual sites in detail.

**Expected Content:**
- Site summary: ID, Name, Stage, Status, Severity, Location, Installer
- System details: Micro Count, Envoy Count, Product SKU, Envoy Type, Connection Type, System Size
- Cases associated with the site (open and closed)
- Site severity history (if available)

---

## 10. Case-Level Investigation

**Purpose:** Allow users to investigate individual cases in detail.

**Expected Content:**
- Case summary: Case Number, Status, Severity, Category, Type, Priority
- Associated site information
- Timeline: Created Date, Last Modified Date, Closed Date
- Owner and assignment information
- Subject and description

⚠️ Business rule requires confirmation: Whether case comments, attachments, or activity history should be included (likely requires SFDC API integration).
