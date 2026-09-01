# Open Questions – C&I Severity and Cases

> Unresolved business, data, and design questions identified during Phase 1 screenshot analysis.
> Priority: **P0** = Must know before implementation | **P1** = Important, needed soon | **P2** = Can be resolved later

---

## P0 — Must Know Before Implementation

### Q1: Severity Level Assignment Rule
**Question:** How is severity level (1, 2, 3, 4) assigned to a site? Is it calculated from site metrics (e.g., % microinverters not reporting), manually assigned, or inherited from SFDC case severity?

**Impact:** Core to the entire dashboard. Every KPI, chart, and table depends on this.

**Evidence:** Screenshot 1 shows severity as a site-level attribute with sub-categories (a/b/c) based on case status. But the original calculation of severity level itself is not visible.

---

### Q2: Sub-category Logic Completeness
**Question:** Are (a), (b), (c) the only sub-categories? The notes define:
- (a) = open case, NOT 'Case - In Progress'
- (b) = open case, marked 'Case - In Progress'
- (c) = NO open cases

Is there a sub-category for sites with multiple cases in different statuses? What happens when a site has both a 'New' case and a 'Case - In Progress' case?

**Impact:** KPI calculation accuracy.

---

### Q3: Complete List of Case Status Values
**Question:** Screenshots confirm `New` and `Case - In Progress`. What other case statuses exist? Are there `Closed`, `Escalated`, `Resolved`, `Pending` statuses?

**Impact:** Determines filter options, case tracker display, and open/closed case classification.

---

### Q4: Complete List of Case Category Values
**Question:** Screenshots only confirm `Microinverter` as a case category. What other categories exist?

**Impact:** Filter design, case tracker grouping.

---

### Q5: Complete List of Case Type Values
**Question:** Screenshots confirm `MI. Drop Out` and `MI. AC Branch Issue`. What is the full list of case types?

**Impact:** Filter design, case tracker categorization.

---

### Q6: Complete List of Site Status Values
**Question:** Screenshots confirm: Normal, Production Issue, Microinverters Not Reporting, Envoy Not Reporting, Meter Issue. Are there additional statuses?

**Impact:** Filter design, status distribution charts, site health page.

---

### Q7: Complete List of Site Stage Values
**Question:** Screenshots confirm: Ready, Final, Verifying. Are there additional stages (e.g., Active, Inactive, Decommissioned)?

**Impact:** Filter design, KPI scope.

---

### Q8: SKU Filter Scope
**Question:** The screenshots show a specific SKU filter applied: `IQ8H-3P-72-E-US, IQ8P-3P-72-E-DOM-US, IQ8P-3P-72-E-US, IQ9N-3P-277-A-DOM-US, IQ9N-3P-277-A-US, IQ9S-3P-277-B-DOM-US`. Is this always applied, or is it a user-selected filter? Does the dashboard only cover these SKUs, or is the full SKU list broader?

**Impact:** Determines whether SKU filtering is hardcoded scope or user-configurable.

---

### Q9: "Open Case" Definition
**Question:** What exactly defines an "open" case? Is it `Case Status != 'Closed'`? Or is it specific values like `New` and `Case - In Progress`?

**Impact:** Open Cases table (526 rows) and No Open Cases table (16 rows) depend on this definition.

---

## P1 — Important

### Q10: Severity 4 Sub-categories
**Question:** Does Severity 4 follow the same (a)/(b)/(c) breakdown as Severity 1/2/3? Screenshot 1 shows Sev 4 with values 9 and 123, but the sub-category labels are partially cut off.

**Impact:** KPI section completeness.

---

### Q11: Historical Data — Why No Sev-4?
**Question:** The historical data table (Screenshot 3) shows Sev-1, Sev-2, Sev-3, and Total columns, but no Sev-4. Is Sev-4 excluded from historical tracking by design, or is it included in Total but not broken out?

**Impact:** Historical trends implementation.

---

### Q12: Historical Data Granularity
**Question:** The visible dates are 2026-08-27, 2026-08-28, 2026-08-29, 2026-08-31, 2026-09-01 (2026-08-30 missing). Is this daily data with weekends excluded, daily with gaps, or irregular?

**Impact:** Time-series chart X-axis configuration.

---

### Q13: Site Link / Drill-down Behavior
**Question:** The Case Tracker has a `Site Link` column. Where does it navigate? To an Enlighten page? To a site detail within this dashboard? To another Incorta view?

**Impact:** Navigation architecture and external link handling.

---

### Q14: Case Number Link Behavior
**Question:** Is the Case Number in the Case Tracker clickable? Does it link to SFDC?

**Impact:** External link integration.

---

### Q15: Inv Produced / Inv ParamBld Fields
**Question:** These fields appear in the site table (Screenshot 1) but not in the open/closed case tables (Screenshot 2) or case tracker (Screenshot 3). Are they always relevant? What do they represent exactly?

**Impact:** Data model — whether to include in all views or only the severity overview.

---

### Q16: Connection Type / Site Stage Filter Defaults
**Question:** Screenshot 1 shows active filters `Connection Type: IN` and `Site Stage Id: IN`. What are the selected values? What are the default filter values when a user first opens the dashboard?

**Impact:** Default state of the dashboard on load.

---

### Q17: Envoy Type Variations
**Question:** Screenshots show `IQD Commercial Gateway`, `IQ Gateway Commercial`, and `IQ Gateway Commercial Si`. Are these distinct device types, or data quality issues with inconsistent naming?

**Impact:** Filter normalization, data quality display.

---

### Q18: No Severity Sites
**Question:** 2,060 total sites minus 457 severity sites = 1,603 sites with no severity. Are these healthy sites, or sites not yet assessed? Should they appear anywhere in the dashboard?

**Impact:** Decides whether "No Severity" is a displayable category or simply excluded from severity views.

---

## P2 — Can Be Resolved Later

### Q19: Export Capability
**Question:** Does the Incorta dashboard support data export (CSV, Excel)? Should the new dashboard include this?

**Impact:** Feature planning for future phases.

---

### Q20: User Roles and Permissions
**Question:** Are there different user roles with different access levels? Should any data be restricted?

**Impact:** Authentication and authorization design.

---

### Q21: Refresh Frequency
**Question:** How often is the Incorta data refreshed? Real-time? Hourly? Daily?

**Impact:** Caching strategy and "last updated" display.

---

### Q22: Multi-language Support
**Question:** Is the dashboard used by non-English speakers? Some site names and locations (QROO/MX) suggest international sites.

**Impact:** i18n considerations.

---

### Q23: Mobile Support
**Question:** Is mobile device access required, or is this strictly a desktop application?

**Impact:** Responsive design scope.

---

### Q24: Historical Data Retention
**Question:** Data is saved since 2025-05-27. Is there a retention limit? Should older data be archived?

**Impact:** Data storage and performance planning.

---

### Q25: Alert / Notification System
**Question:** Should the dashboard include alerts or notifications (e.g., new Sev-1 site, case status change)?

**Impact:** Future feature planning.

---

### Q26: Tabs Outside "Severity and Cases"
**Question:** Screenshot 1 shows other tabs: "C&I Sites: 1", "C&I State of Health", "Activations", "Legacy Commercial Sites". Will the new dashboard eventually replace these too, or only the "C&I - Severity and Cases" tab?

**Impact:** Scope definition for future phases.
