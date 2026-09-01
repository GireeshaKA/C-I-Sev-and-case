# Dashboard Requirements – C&I Severity and Cases

> Updated based on detailed analysis of three Incorta dashboard screenshots.
> Classification: **CONFIRMED** = directly visible in screenshots | **INFERRED** = logically deduced | **RECOMMENDED** = proposed improvement
> Business rules marked with ⚠️ require confirmation from stakeholders.

---

## 1. KPI Section

**Source:** Screenshot 1 — two KPI rows visible.

**Purpose:** Provide at-a-glance summary metrics across all C&I sites.

### KPI Row 1 — Primary KPIs (CONFIRMED)

| KPI | Display Label | Example Value | Unit | Likely Calculation | Confidence |
|---|---|---|---|---|---|
| Total C&I Sites | Total C&I Sites | 2,060 | Count | Count of all C&I sites matching active filters (SKU + Connection Type + Site Stage) | CONFIRMED |
| % Sites in Sev 1/2/3 | %Sites in Sev1/2/3 | 16.2% | Percentage | (Sev1 + Sev2 + Sev3 site count) / Total C&I Sites × 100 | CONFIRMED |
| # Sites in Sev 1/2/3 | #Sites in Sev 1/2/3 | 334 | Count | Sum of sites at severity 1, 2, and 3 | CONFIRMED |
| Sev 1/2/3 (a) | Sev 1/2/3 (a) | 31 | Count | Severity sites with open case NOT marked as 'Case - In Progress' | CONFIRMED |
| Sev 1/2/3 (b) | Sev 1/2/3 (b) | 287 | Count | Severity sites with open case marked as 'Case - In Progress' | CONFIRMED |
| Sev 1/2/3 (c) | Sev 1/2/3 (c) | 16 | Count | Severity sites with NO open cases | CONFIRMED |
| % Sites in Sev 4 | Sites in Sev4 | 6.0% | Percentage | Sev4 site count / Total C&I Sites × 100 | CONFIRMED |
| # Sites in Sev 4 | #Sites in Sev 4 | 123 | Count | Count of sites at severity 4 | CONFIRMED |

### Validation: 334 (Sev 1/2/3) + 123 (Sev 4) = 457 severity sites. 457 / 2060 = 22.2% total severity. 334 / 2060 = 16.2% ✓

### Sub-category definitions (CONFIRMED from Notes):

- **(a)** = Severity site with open case and NOT marked as 'Case - In Progress'
- **(b)** = Severity site with open case and marked as 'Case - In Progress'
- **(c)** = Severity site with NO open cases

### KPI Row 2 — Percentage KPIs (CONFIRMED)

| KPI | Display Label | Example Value | Confirmed |
|---|---|---|---|
| Total C&I Sites | Total C&I Sites | 2,060 | CONFIRMED |
| % Sites in Sev 1,2,3 | %Sites in Sev1,2,3 | 16.2% | CONFIRMED |
| % Sites in Sev 1 | %Sites in Sev1 | 6.7% | CONFIRMED |
| % Sites in Sev 2 | %Sites in Sev2 | 3.3% | CONFIRMED |
| % Sites in Sev 3 | %Sites in Sev3 | 6.2% | CONFIRMED |
| % Sites in Sev 4 | %Sites in Sev4 | 6.0% | CONFIRMED |

### Validation: 6.7% + 3.3% + 6.2% = 16.2% ✓ (matches combined Sev 1/2/3 KPI)

---

## 2. Severity Breakdown Section

**Source:** Screenshot 1 — severity breakdown with (a)/(b)/(c) sub-categories per severity level.

**Purpose:** Show per-severity-level counts broken down by case sub-category.

### Sev 1 Sites (CONFIRMED)

| Metric | Value |
|---|---|
| Total | 139 |
| (a) — Open case, not 'Case - In Progress' | 13 |
| (b) — Open case, 'Case - In Progress' | 121 |
| (c) — No open cases | 5 |

**Validation:** 13 + 121 + 5 = 139 ✓

### Sev 2 Sites (CONFIRMED)

| Metric | Value |
|---|---|
| Total | 67 |
| (a) — Open case, not 'Case - In Progress' | 2 |
| (b) — Open case, 'Case - In Progress' | 63 |
| (c) — No open cases | 2 |

**Validation:** 2 + 63 + 2 = 67 ✓

### Sev 3 Sites (CONFIRMED)

| Metric | Value |
|---|---|
| Total | 128 |
| (a) — Open case, not 'Case - In Progress' | 16 |
| (b) — Open case, 'Case - In Progress' | 103 |
| (c) — No open cases | 9 |

**Validation:** 16 + 103 + 9 = 128 ✓

### Sev 4 Sites (CONFIRMED)

| Metric | Value |
|---|---|
| Total | 123 |
| (c) — (implied no open cases or minimal) | 9? |

⚠️ Sev 4 sub-categories partially visible. Only two sub-values visible (9 and 123). Need confirmation whether Sev 4 follows the same (a)/(b)/(c) breakdown.

### Cross-validation:

- Sev 1 (139) + Sev 2 (67) + Sev 3 (128) = 334 ✓ (matches #Sites in Sev 1/2/3 KPI)
- Sev 1 (a) 13 + Sev 2 (a) 2 + Sev 3 (a) 16 = 31 ✓ (matches Sev 1/2/3 (a) KPI)
- Sev 1 (b) 121 + Sev 2 (b) 63 + Sev 3 (b) 103 = 287 ✓ (matches Sev 1/2/3 (b) KPI)
- Sev 1 (c) 5 + Sev 2 (c) 2 + Sev 3 (c) 9 = 16 ✓ (matches Sev 1/2/3 (c) KPI)

---

## 3. Site Status Model

**Source:** Screenshots 1, 2, 3 — Site Status column values.

**CONFIRMED statuses visible in screenshots:**

| Status | Visible In | Confirmed |
|---|---|---|
| Normal | Screenshot 1 (site table) | CONFIRMED |
| Production Issue | Screenshots 1, 2, 3 | CONFIRMED |
| Microinverters Not Reporting | Screenshots 2, 3 | CONFIRMED |
| Envoy Not Reporting | Screenshots 1, 2, 3 | CONFIRMED |
| Meter Issue | Screenshot 2 | CONFIRMED |

**⚠️ CORRECTION from Phase 0:** The Phase 0 data model assumed statuses: Normal, Warning, Critical, Offline, Unknown. These were **NOT confirmed** by screenshots. The actual statuses are operational descriptions, not abstract severity categories. The type model must be updated.

---

## 4. Open Cases Section

**Source:** Screenshot 2 — "C&I Sites & SFDC OPEN Cases Only"

**Purpose:** Show all sites that have at least one SFDC open case, with site-level details.

**Key insight:** This is a **site-level table**, not a case-level table. It shows sites that have open cases, with site attributes displayed.

**Confirmed columns:** Site Id, Site Name, Site Stage, Site Status, Last Interval End Date (PST), Micro count, Envoy Count, MI Product Sku, Envoy Types, Installer Name, State (partially visible), Country (partially visible)

**Row count:** 526 rows (CONFIRMED)

**Important:** The SKU filter is applied to this section, limiting results to specific product SKUs.

---

## 5. No-Open-Cases Section

**Source:** Screenshot 2 — "C&I Sites & SFDC NO OPEN Cases"

**Purpose:** Show severity sites that do NOT have an open SFDC case.

**Key insight:** This is also a **site-level table** with the same column structure as the open cases section.

**Confirmed columns:** Site Id, Site Name, Site Stage, Site Status, Last Interval End Date (PST), Micro count, Envoy Count, MI Product Sku, Envoy Types, Installer Name, State, Country

**Row count:** 16 rows (CONFIRMED)

**Note:** These sites still have a site status issue (e.g., Envoy Not Reporting, Meter Issue, Production Issue) but no corresponding SFDC case has been opened. This is potentially an action list for proactive case creation.

---

## 6. Case Tracker

**Source:** Screenshot 3 — "C&I Sites Case Tracker"

**Purpose:** Case-level tracking table linking cases to sites with full detail.

**Confirmed columns (in order):**

| # | Column | Example Values | Confirmed |
|---|---|---|---|
| 1 | Case Number | 20139519, 19937672 | CONFIRMED |
| 2 | Site Id | 6320142, 5324934 | CONFIRMED |
| 3 | Site Link | 6320142, 5324934 (appears clickable) | CONFIRMED |
| 4 | Site Name | Dunsoth Fire Department, Chrome Solar Corp | CONFIRMED |
| 5 | Site Status | Production Issue, Microinverters Not Reporting, Envoy Not Reporting | CONFIRMED |
| 6 | Last Interval End Date (PST) | 2026-09-01 01:57:38 | CONFIRMED |
| 7 | MI Product Sku | IQ8P-3P-72-E-US | CONFIRMED |
| 8 | Connection Type | Ethernet, Wifi, Cellular | CONFIRMED |
| 9 | Case Status | New, Case - In Progress | CONFIRMED |
| 10 | Severity | 3(b), 3(c), 1(c) | CONFIRMED |
| 11 | Case Category | Microinverter | CONFIRMED |
| 12 | Case Type | MI. Drop Out, MI. AC Branch Issue | CONFIRMED |

**Row count:** 583 rows (CONFIRMED)

**⚠️ Key observation on Severity column:** Values like `3(b)` and `1(c)` combine the severity level with the sub-category notation from the KPI section. This means severity is a **composite** of numeric level + case sub-category letter.

---

## 7. Historical Severity Data

**Source:** Screenshot 3 — "Historical Data per Installer (saved since 2025-05-27)"

**Purpose:** Track severity counts over time, grouped by installer.

**Structure:** Pivot table with date columns grouped by date, sub-columned by severity level.

**Confirmed date columns:** 2026-08-27, 2026-08-28, 2026-08-29, 2026-08-31, 2026-09-01

**Confirmed severity sub-columns per date:** Sev-1 Sites, Sev-2 Sites, Sev-3 Sites, Total Sites

**Note:** 2026-08-27 only shows Sev-2 and Sev-3 (no Sev-1 column), other dates show all three.

**Granularity:** Daily (with some gaps — 2026-08-30 missing). CONFIRMED daily, but not necessarily every day.

**Aggregation:** Per installer, with totals row at bottom.

**Row count:** 497 rows (CONFIRMED)

**Data retention:** "saved since 2025-05-27" — approximately 15+ months of data. CONFIRMED.

**⚠️ Sev-4 not visible in historical table.** Only Sev-1, Sev-2, Sev-3 appear as sub-columns. This is either because Sev-4 sites don't have cases to track historically, or the historical table excludes Sev-4 by design.

---

## 8. Filters

**Source:** Screenshot 1 — active filter chips visible.

### Confirmed Filters

| Filter | Control Type | Observed Values | Confirmed |
|---|---|---|---|
| Connection Type | Filter chip (IN operator) | IN (multi-value) | CONFIRMED |
| Site Stage Id | Filter chip (IN operator) | IN (multi-value) | CONFIRMED |
| SKU Filter | Applied as text label | Specific SKU list | CONFIRMED |
| Clear All | Button (top-right) | — | CONFIRMED |

### Confirmed filter behavior:

- Filters appear as removable chips with × buttons — CONFIRMED
- "Clear All" link in top-right to reset filters — CONFIRMED
- Filters use "IN" operator suggesting multi-select — CONFIRMED
- SKU filter displayed as a descriptive text rather than chip — CONFIRMED

### RECOMMENDED Additional Filters (not confirmed in screenshots):

- Severity level
- Site Status
- Installer Name
- State / Country
- Date Range

⚠️ The screenshots show only a filtered view; the full filter panel may have additional options not visible in the current state.

---

## 9. Site-Level Drill-Down

**Source:** Screenshot 3 — "Site Link" column in Case Tracker appears clickable.

**CONFIRMED:** The Case Tracker has a "Site Link" column showing Site IDs, suggesting site drill-down capability.

**INFERRED:** Clicking a Site Link likely navigates to a site detail view.

⚠️ No screenshot of the actual site detail view was provided. Requirements for site drill-down content are INFERRED.

---

## 10. Case-Level Investigation

**Source:** Screenshot 3 — Case Tracker table.

**CONFIRMED:** Case Number column exists in Case Tracker.

**INFERRED:** Case Number may be clickable to navigate to case detail in SFDC.

⚠️ No screenshot of a case detail view was provided. Requirements for case drill-down are INFERRED.

---

## 11. Tab Navigation

**Source:** Screenshot 1 — tab bar visible.

**CONFIRMED tabs:**

| Tab | Label | Notes |
|---|---|---|
| 1 | C&I Sites: 1 | Likely the main site list |
| 2 | C&I State of Health | Site health dashboard |
| 3 | Activations | Activation tracking |
| 4 | C&I - Severity and Cases | Currently active tab (with ∧ indicator) |
| 5 | Legacy Commercial Sites | Legacy site view |

The "C&I - Severity and Cases" tab contains all the content visible in the three screenshots.
