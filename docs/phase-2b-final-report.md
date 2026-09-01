# Phase 2B Final Report — Business Rules & Data Contract Review

> C&I – Severity and Cases Dashboard
> Date: 2026-09-02

---

## 1. Scope

Phase 2B is a controlled analysis and documentation phase. Its purpose is to inspect the existing repository and produce a precise business/data contract for eventual live-data integration.

**Explicitly out of scope:**
- Connecting to Incorta or any live data source
- Implementing authentication or API endpoints
- Replacing MockDataProvider
- Modifying the UI (no layout, color, navigation, or chart changes)
- Changing confirmed reference values

---

## 2. Files Reviewed

### Documentation
- `docs/screenshot-analysis.md` — Detailed element-by-element analysis of Incorta screenshots
- `docs/ui-ux-specification.md` — Design direction and component specifications
- `docs/dashboard-requirements.md` — Confirmed requirements from Phase 1
- `docs/data-dictionary.md` — Field-level data definitions
- `docs/dashboard-component-map.md` — Component dependency graph
- `docs/architecture.md` — Technology stack and data architecture
- `docs/open-questions.md` — Unresolved business/data/design questions

### Source Code
- `src/types/site.ts` — Site, SeverityLevel, SeveritySubcategory, SiteStatus, SiteStage, ConnectionType, EnvoyType
- `src/types/case.ts` — SfdcCase, CaseStatus, CaseCategory, CaseType
- `src/types/severity.ts` — SeverityDistribution, HistoricalSeverity
- `src/types/kpi.ts` — KpiMetric, DashboardKpis
- `src/types/filters.ts` — DashboardFilters
- `src/types/index.ts` — Type re-exports
- `src/services/DataProvider.ts` — Abstract DataProvider interface
- `src/services/MockDataProvider.ts` — Mock implementation with KPI calculations
- `src/App.tsx` — Full dashboard UI (all 6 pages)
- `src/index.css` — Global styles

### Mock Data
- `mock-data/sites.ts` — 2,060 programmatically generated sites
- `mock-data/cases.ts` — Cases generated from open-case sites
- `mock-data/historical-severity.ts` — ~8,400 historical records
- `mock-data/index.ts` — Re-exports

### Tests
- `tests/mock-data-provider.test.ts` — Data provider tests (41 tests)
- `tests/app.test.tsx` — UI rendering tests (3 tests)

---

## 3. Confirmed Business Rules

| # | Rule | Evidence |
|---|---|---|
| 1 | Severity levels are 1, 2, 3, 4 (not S0–S4; no S0) | Screenshot 1, requirements doc |
| 2 | Sev 1/2/3 subcategories: (a) open/not in progress, (b) open/in progress, (c) no open cases | Screenshot 1, requirements doc |
| 3 | Composite severity format: `{level}({subcategory})` e.g., `3(b)` | Screenshot 3 |
| 4 | Total C&I Sites = 2,060 | Screenshot 1 KPI |
| 5 | Sev 1 = 139, Sev 2 = 67, Sev 3 = 128, Sev 4 = 123 | Screenshot 1 KPIs |
| 6 | Sev 1/2/3 (a) = 31, (b) = 287, (c) = 16, total = 334 | Screenshot 1 KPIs |
| 7 | %Sev 1/2/3 = 16.2%, %Sev 4 = 6.0%, %Sev 1 = 6.7%, %Sev 2 = 3.3%, %Sev 3 = 6.2% | Screenshot 1 KPIs |
| 8 | Percentage denominator = Total C&I Sites (2,060) | Verified by arithmetic |
| 9 | Case statuses: `New`, `Case - In Progress` | Screenshot 3 |
| 10 | Site statuses: Normal, Production Issue, Microinverters Not Reporting, Envoy Not Reporting, Meter Issue | Screenshot 1/2/3 |
| 11 | Site stages: Ready, Final, Verifying | Screenshot 1 |
| 12 | Connection types: Ethernet, Wifi, Cellular | Screenshot 1/3 |
| 13 | Envoy types: IQD Commercial Gateway, IQ Gateway Commercial, IQ Gateway Commercial Si | Screenshot 1 |
| 14 | Open Cases page: 526 sites with open cases, 16 severity sites without | Screenshot 2 |
| 15 | Case Tracker: 583 case records, 12 columns | Screenshot 3 |
| 16 | Historical data: per-installer, per-date, Sev-1/2/3/Total only, since 2025-05-27 | Screenshot 3 |
| 17 | Filters: Connection Type, Site Stage Id, SKU with IN-style behavior | Screenshot 1 filter chips |
| 18 | Site ID format: numeric string (e.g., `6256648`) | Screenshot 1 |
| 19 | Case Number format: 8-digit numeric (e.g., `20139519`) | Screenshot 3 |
| 20 | Historical Total = Sev-1 + Sev-2 + Sev-3 | Screenshot 3 column structure |

---

## 4. Inferred Rules

| # | Rule | Basis for Inference |
|---|---|---|
| 1 | Severity is a site-level attribute, not case-level | Severity shown in site tables, not derived from individual case rows |
| 2 | Subcategory (a) = site has open case(s) where none is 'Case - In Progress' | Logical from (a)/(b)/(c) definitions |
| 3 | Subcategory (b) = site has open case(s) where ≥1 is 'Case - In Progress' | Logical from (a)/(b)/(c) definitions |
| 4 | One site can have multiple cases | 583 cases for 526 sites implies ~1.11 avg |
| 5 | Each site has one installer | Each site row shows one installer name |
| 6 | Site statuses are mutually exclusive | One status shown per site row |
| 7 | Historical values are daily snapshots, not events | Values represent counts, not deltas |
| 8 | "No Severity" population = 2,060 − 457 = 1,603 | Reconciliation arithmetic |
| 9 | `hasOpenCase` is true when ≥1 open SFDC case exists | Logical from page structure |
| 10 | `siteLink` equals `siteId` | Visual comparison in screenshots |

---

## 5. Unresolved Rules

| # | Rule | Why Unresolved | Priority |
|---|---|---|---|
| 1 | How severity level (1–4) is assigned to a site | No documentation of the severity algorithm or rule engine | P0 |
| 2 | Complete definition of "open case" — which SFDC statuses qualify | Only 'New' and 'Case - In Progress' are visible; unknown if others exist | P0 |
| 3 | Formal business definition of "No Severity" | 1,603 sites implied by reconciliation; unclear if healthy, unassessed, or excluded | P0 |
| 4 | Whether Sev 4 follows (a)/(b)/(c) subcategory model | Only partially visible in screenshots | P1 |
| 5 | Multi-case aggregation rule for subcategory | Which subcategory when a site has both 'New' and 'In Progress' cases? | P1 |
| 6 | Whether "No Severity" should appear in the UI | No screenshot shows it as a category; needs business decision | P1 |
| 7 | Whether site statuses are truly mutually exclusive | Cannot determine from screenshots alone | P1 |
| 8 | Whether the 5 confirmed site statuses are exhaustive | Could be more in production | P1 |
| 9 | Complete Case Category values | Only 'Microinverter' confirmed from screenshots | P1 |
| 10 | Complete Case Type values | Only 'MI. Drop Out' and 'MI. AC Branch Issue' confirmed | P1 |
| 11 | Historical data timezone | Dates shown without timezone context | P2 |
| 12 | Whether historical values are snapshots or events | Assumed snapshots but not confirmed | P1 |
| 13 | Why Sev-4 is excluded from historical data | By design or limitation? | P2 |
| 14 | Whether percentage denominators change with filters | Confirmed for unfiltered view; unknown for filtered | P1 |
| 15 | Source field names (Incorta column names) | Cannot be determined from screenshots | P1 |
| 16 | Whether a case can belong to multiple sites | No evidence either way | P2 |
| 17 | Whether Site Stage values are exhaustive | Only 3 visible | P2 |
| 18 | Whether Connection Type values are exhaustive | Only 3 visible | P2 |

---

## 6. KPI Reconciliation

All arithmetic relationships verified:

| Check | Calculation | Result | Status |
|---|---|---|---|
| Sev 1+2+3 | 139 + 67 + 128 | 334 | ✓ CONFIRMED |
| %Sev 1/2/3 | 334 / 2060 × 100 | 16.21% → 16.2% | ✓ CONFIRMED |
| %Sev 4 | 123 / 2060 × 100 | 5.97% → 6.0% | ✓ CONFIRMED |
| %Sev 1 | 139 / 2060 × 100 | 6.75% → 6.7% | ✓ CONFIRMED |
| %Sev 2 | 67 / 2060 × 100 | 3.25% → 3.3% | ✓ CONFIRMED |
| %Sev 3 | 128 / 2060 × 100 | 6.21% → 6.2% | ✓ CONFIRMED |
| (a)+(b)+(c) | 31 + 287 + 16 | 334 | ✓ CONFIRMED |
| Sev 1: 13+121+5 | | 139 | ✓ CONFIRMED |
| Sev 2: 2+63+2 | | 67 | ✓ CONFIRMED |
| Sev 3: 16+103+9 | | 128 | ✓ CONFIRMED |
| Cross-(a): 13+2+16 | | 31 | ✓ CONFIRMED |
| Cross-(b): 121+63+103 | | 287 | ✓ CONFIRMED |
| Cross-(c): 5+2+9 | | 16 | ✓ CONFIRMED |
| Total severity | 334 + 123 | 457 | ✓ CONFIRMED |
| No Severity | 2060 − 457 | 1,603 | ✓ INFERRED |

---

## 7. Severity Reconciliation

Fully reconciled. See KPI Reconciliation above and `docs/data-contract.md` Section 2 for the complete per-level breakdown.

Key findings:
- All Sev 1/2/3 subcategory counts cross-validate perfectly
- Sev 4 subcategory breakdown remains **UNRESOLVED**
- Mock data assigns Sev 4 as (b)=100, (c)=23 — **this is assumed, not confirmed**

---

## 8. "No Severity" Reconciliation

- **Implied count: 1,603** (2,060 − 457)
- **Formal definition: UNRESOLVED**
- **Whether to display: UNRESOLVED** — requires business decision
- **Impact areas identified:** KPI totals (denominator), site tables, filtering, severity distribution

The current dashboard correctly uses 2,060 as the denominator for all percentage calculations, which means the "No Severity" population is implicitly included in the denominator but never shown as a separate category. This matches the screenshot behavior.

---

## 9. Site Status Model

- **5 confirmed values:** Normal, Production Issue, Microinverters Not Reporting, Envoy Not Reporting, Meter Issue
- **Mutual exclusivity:** INFERRED (one status per row in screenshots)
- **Exhaustiveness:** UNRESOLVED
- **Calculation method:** UNRESOLVED
- **Mock status distribution:** NOT reference values — clearly labeled as MOCK in dashboard

---

## 10. Open Case Model

- **Open Cases page:** Site-level view (526 sites with open cases)
- **Case Tracker page:** Case-level view (583 individual case records)
- **Case statuses:** New, Case - In Progress (CONFIRMED)
- **Site→Case relationship:** 1:N (CONFIRMED: 583 cases / 526 sites)
- **Severity subcategory derivation:** From case existence and status (INFERRED)
- **Multi-case aggregation:** UNRESOLVED — priority rule when multiple case statuses exist on one site

---

## 11. Case Tracker Contract

12-column structure fully documented in `docs/data-contract.md` Section 4.

Key findings:
- Columns 1, 9, 11, 12 are case attributes
- Columns 2–8 are site attributes (joined)
- Column 10 (Severity) is a derived composite string
- All source field names are UNKNOWN — source mapping required

---

## 12. Historical Data Contract

Fully documented in `docs/data-contract.md` Section 5.

Key findings:
- Grain: installer × date
- Measures: Sev-1, Sev-2, Sev-3, Total
- Sev-4: NOT included (CONFIRMED)
- Start date: 2025-05-27 (CONFIRMED)
- Daily snapshots vs events: UNRESOLVED
- Timezone: UNRESOLVED
- Mock generates ~8,400 rows; reference shows 497 (production volume unknown)

---

## 13. Filter Contract

Fully documented in `docs/data-contract.md` Section 6.

Key findings:
- 3 confirmed filters: Connection Type, Site Stage Id, SKU
- All use IN-style multi-value semantics
- Architecture already supports arrays (`DashboardFilters` uses `T[]` types)
- UI currently uses single-select; multi-select UI deferred to Phase 3
- 5 additional filters recommended but NOT confirmed

---

## 14. Data Relationships

Entity relationship model documented in `docs/data-contract.md` Section 8.

```
SITE (siteId PK) --1:N--> CASE (caseNumber PK, siteId FK)
SITE (siteId PK) --N:1--> INSTALLER (installerName)
SITE --has current--> SEVERITY (level, subcategory)
HISTORICAL SEVERITY --grouped by--> INSTALLER × DATE
```

All relationships documented with their confidence status (CONFIRMED, INFERRED, UNRESOLVED).

---

## 15. Mock Data Audit

Full audit in `docs/mock-data-audit.md`.

### Critical Findings

| # | Finding | Severity |
|---|---|---|
| 1 | Sev 4 subcategories (b)=100, (c)=23 are **fabricated** — not confirmed from screenshots | High |
| 2 | Case Category values beyond 'Microinverter' are fabricated | Medium |
| 3 | Case Type values beyond 'MI. Drop Out' and 'MI. AC Branch Issue' are fabricated | Medium |
| 4 | Mock derives case status FROM subcategory; real system likely derives subcategory FROM case status (inverted causality) | Medium |
| 5 | `sitesWithNoOpenCases` KPI calculates `total - openCaseSites` but reference value 16 implies "severity sites without cases" only | Medium |
| 6 | Site status distribution is mock-generated; only the status labels are confirmed | Low |

---

## 16. Business/Data Gaps

| # | Gap | Description | Impact | Priority | Required Decision |
|---|---|---|---|---|---|
| 1 | Severity assignment | How is severity (1–4) calculated/assigned? | Core business logic | P0 | Source system documentation |
| 2 | Open case definition | Which SFDC statuses = "open"? | Subcategory calculation | P0 | SFDC configuration review |
| 3 | No Severity definition | What are the 1,603 non-severity sites? | KPI totals, filtering | P0 | Business owner definition |
| 4 | Sev-4 subcategories | Does Sev 4 follow (a)/(b)/(c)? | Severity breakdown | P1 | Stakeholder confirmation |
| 5 | Multi-case aggregation | Priority rule for subcategory when multiple cases | Data accuracy | P1 | Business rule definition |
| 6 | No Severity in UI | Should it appear as a category? | Page design | P1 | Stakeholder decision |
| 7 | Percentage denominators under filters | Does denominator change with filter context? | KPI accuracy | P1 | Filtered screenshot comparison |
| 8 | Historical snapshot vs event | Are values end-of-day snapshots? | Data interpretation | P1 | Source system docs |
| 9 | Case Category completeness | Full list from SFDC | Type safety, filters | P1 | SFDC review |
| 10 | Case Type completeness | Full list from SFDC | Type safety, filters | P1 | SFDC review |
| 11 | Site Status exhaustiveness | Are 5 values the complete set? | Type safety, display | P1 | Source system review |
| 12 | Site Status mutual exclusivity | Can a site have multiple statuses? | Data model | P1 | Source system review |
| 13 | Source field names | Incorta/SFDC column names unknown | API integration | P1 | Source access |
| 14 | Historical timezone | What TZ are dates in? | Display accuracy | P2 | Source system docs |
| 15 | Sev-4 in historical | Why excluded? By design? | Historical completeness | P2 | Business owner |
| 16 | No Severity in historical | Should it be tracked? | Historical completeness | P2 | Business owner |
| 17 | KPI cross-filtering | Should clicking a KPI filter tables? | UX design | P2 | Stakeholder decision |
| 18 | Narrow-screen column priorities | Which columns hide first? | Responsive design | P2 | Stakeholder input |

---

## 17. Tests

### Results

- **Test files:** 2 passed (2 total)
- **Tests:** 41 passed (41 total)
- **New tests added:** 17 (in `tests/mock-data-provider.test.ts`)

### New Test Coverage

| Test | What It Verifies |
|---|---|
| Confirmed per-level counts (Sev 1/2/3/4) | 139, 67, 128, 123 match references |
| Sev 2 subcategory reconciliation | (a)=2, (b)=63, (c)=2, total=67 |
| Sev 3 subcategory reconciliation | (a)=16, (b)=103, (c)=9, total=128 |
| Cross-level (a)/(b)/(c) totals | (a)=31, (b)=287, (c)=16, sum=334 |
| Historical total = sev1+sev2+sev3 | Verified on first 100 records |
| Confirmed KPI count values | totalSites=2060, countSev123=334, subcategories=31/287/16, countSev4=123 |
| Confirmed KPI percentage values | 16.2%, 6%, 6.7%, 3.3%, 6.2% |
| All 13 KPI fields present | Field-level structural check |
| 2060 total sites | Exact count |
| 334 sites in Sev 1+2+3 | Exact count |
| 457 severity sites / 1603 no-severity | Reconciliation check |
| Site status enum enforcement | All sites have one of 5 confirmed statuses |
| Case status enum enforcement | All cases are 'New' or 'Case - In Progress' |
| Array-based multi-value filtering | IN-style filter works correctly |
| Severity array filter | Combined severity filter returns correct count |
| Composite severity format | All cases match `^\d\([abc]\)$` pattern |
| Connection type confirmed values | Ethernet, Wifi, Cellular all present |

### Tests NOT Added (Intentionally)

- No test for Sev 4 subcategory split — values are UNRESOLVED
- No test for `sitesWithNoOpenCases` specific value — calculation may differ from reference
- No test for site status distribution counts — mock-derived, not reference values
- No test for historical row count — 497 is reference, mock produces ~8,400

---

## 18. Build

```
✓ built in 26.45s
```

No errors. Production bundle generated successfully.

---

## 19. Lint

```
eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
```

0 errors, 0 warnings.

---

## 20. Recommendation for Phase 3

### Prerequisites (Must Be Resolved Before Live Integration)

| # | Prerequisite | Priority |
|---|---|---|
| 1 | Obtain severity assignment rules — how levels 1–4 are calculated | P0 |
| 2 | Confirm complete list of "open" case statuses from SFDC | P0 |
| 3 | Define "No Severity" formally — what it means, whether to display | P0 |
| 4 | Confirm Sev 4 subcategory model | P1 |
| 5 | Define multi-case aggregation rule for subcategory assignment | P1 |
| 6 | Obtain source field names (Incorta/SFDC column mappings) | P1 |
| 7 | Confirm Case Category and Case Type complete value lists | P1 |
| 8 | Verify site status exhaustiveness and mutual exclusivity | P1 |
| 9 | Confirm percentage denominator behavior under filters | P1 |
| 10 | Confirm historical data semantic (snapshot vs event, timezone) | P1 |

### Phase 3 Implementation Approach

1. **Create `APIDataProvider`** implementing the existing `DataProvider` interface
2. **Keep `MockDataProvider`** as dev/test fallback (do not remove)
3. **Provider swap via configuration** — no UI code changes needed
4. **Do NOT carry mock assumptions** into production:
   - Sev 4 subcategory split (b)=100, (c)=23 is fabricated
   - Case Category/Type values beyond confirmed are fabricated
   - Site status distribution is mock-generated
5. **Implement multi-select filter UI** once API is available
6. **Address `sitesWithNoOpenCases` KPI** — clarify whether it means "all non-open-case sites" or "severity sites without cases"

---

## Phase 2B Deliverables

| # | Deliverable | File |
|---|---|---|
| 1 | Business Rules Matrix | `docs/business-rules-matrix.md` |
| 2 | Data Contract (KPI, severity, site table, case tracker, historical, filter, source mapping, relationships, gaps) | `docs/data-contract.md` |
| 3 | Mock Data Audit | `docs/mock-data-audit.md` |
| 4 | Final Report | `docs/phase-2b-final-report.md` |
| 5 | Updated Tests | `tests/mock-data-provider.test.ts` (24 → 41 tests) |

---

## PHASE 2B STATUS: COMPLETE

## PHASE 3 READINESS: NOT READY

**Reason:** 3 P0 business questions remain unresolved:
1. Severity assignment rules
2. Open case definition
3. "No Severity" formal definition

Phase 3 may begin once these are answered. The architecture (DataProvider interface, type system, KPI calculations) is ready to support a real data provider once source mappings are established.
