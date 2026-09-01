# Mock Data Audit — C&I Severity and Cases Dashboard

> Phase 2B deliverable.
> Reviews every significant mock data value and classifies it as confirmed reference, derived, synthetic, or assumed.

---

## 1. Mock Sites (`mock-data/sites.ts`)

### Generation Strategy

Sites are generated programmatically using a seeded random number generator (`seed=42`) to ensure deterministic output. The generation plan hard-codes severity/subcategory distributions to match confirmed reference values.

### Generation Plan (line 71–81)

```typescript
const plan: [SeverityLevel, SeveritySubcategory, number][] = [
  [1,'a',13],[1,'b',121],[1,'c',5],    // Sev 1: 139 total
  [2,'a',2],[2,'b',63],[2,'c',2],      // Sev 2: 67 total
  [3,'a',16],[3,'b',103],[3,'c',9],    // Sev 3: 128 total
  [4,'b',100],[4,'c',23],              // Sev 4: 123 total ⚠️
];
// Remaining 1603 sites have no severity
```

### Value Audit

| Value/Aspect | Classification | Notes | Action for Phase 3 |
|---|---|---|---|
| **Total site count: 2,060** | A — Confirmed reference | Matches KPI from screenshots | Replace with real provider |
| **Sev 1 count: 139** | A — Confirmed reference | Matches screenshot KPI | Replace with real provider |
| **Sev 2 count: 67** | A — Confirmed reference | Matches screenshot KPI | Replace with real provider |
| **Sev 3 count: 128** | A — Confirmed reference | Matches screenshot KPI | Replace with real provider |
| **Sev 4 count: 123** | A — Confirmed reference | Matches screenshot KPI | Replace with real provider |
| **Sev 1 (a)=13, (b)=121, (c)=5** | A — Confirmed reference | Matches cross-validated KPIs | Replace with real provider |
| **Sev 2 (a)=2, (b)=63, (c)=2** | A — Confirmed reference | Matches cross-validated KPIs | Replace with real provider |
| **Sev 3 (a)=16, (b)=103, (c)=9** | A — Confirmed reference | Matches cross-validated KPIs | Replace with real provider |
| **Sev 4 (b)=100, (c)=23** | D — Assumed business logic | ⚠️ NOT confirmed from screenshots. Sev 4 subcategory split is fabricated. Screenshots show only two partially visible values (9, 123). | Must be confirmed or removed |
| **No-severity count: 1,603** | B — Derived | Calculated as 2060 − 457. Confirmed by reconciliation but not explicitly labeled in screenshots | Replace with real provider |
| **Site names** | C — Synthetic | Invented names loosely inspired by screenshot examples | Replace with real provider |
| **Site IDs** | C — Synthetic | Random 7-digit numeric strings; format matches confirmed pattern | Replace with real provider |
| **Installer names** | C — Synthetic | Mix of screenshot-derived names and invented names | Replace with real provider |
| **Site Stage distribution** | C — Synthetic | Randomly assigned from `Ready`, `Final` (Verifying excluded from gen) | Replace with real provider |
| **Site Status assignment** | D — Assumed business logic | Logic: `hasOpenCase → non-Normal status; severity but no case → random; no severity → Normal`. This is an assumption, not confirmed. | Replace with real provider |
| **Last Interval End Date** | C — Synthetic | Random datetime in 2026 range | Replace with real provider |
| **Micro Count** | C — Synthetic | Random 5–404 | Replace with real provider |
| **Envoy Count** | C — Synthetic | Random 1–4 | Replace with real provider |
| **MI Product SKU** | C — Synthetic | Random from confirmed SKU list | Replace with real provider |
| **Envoy Type** | C — Synthetic | Random from confirmed envoy types | Replace with real provider |
| **State** | C — Synthetic | Random from subset of US states + QROO | Replace with real provider |
| **Country** | C — Synthetic | 90% US, 10% MX (weighted pick) | Replace with real provider |
| **Connection Type** | C — Synthetic | Random from confirmed values | Replace with real provider |
| **Inv Produced** | C — Synthetic | Generated pattern matching screenshot format | Replace with real provider |
| **Inv ParamBld** | C — Synthetic | Static value matching screenshot | Replace with real provider |
| **hasOpenCase derivation** | D — Assumed business logic | `sub === 'a' \|\| sub === 'b'` — derived from subcategory, not from actual case lookup | Replace with real case join |

### Critical Finding: Sev 4 Subcategory Assumption

Lines 75 in `mock-data/sites.ts`:
```typescript
[4,'b',100],[4,'c',23],
```

This assigns 100 Sev-4 sites subcategory `'b'` and 23 sites subcategory `'c'`. **This is fabricated.** The screenshots do not confirm:
- Whether Sev 4 uses (a)/(b)/(c) at all
- What the actual split would be
- Whether `(a)` exists for Sev 4

**Recommendation:** Keep as-is for mock functionality but clearly document as UNRESOLVED. Do NOT carry this assumption into the production provider.

---

## 2. Mock Cases (`mock-data/cases.ts`)

### Generation Strategy

Cases are generated for every site where `hasOpenCase === true`. Each site gets 1–2 cases (random). Case status is derived from subcategory: `(a)` → `'New'`; `(b)` → `'Case - In Progress'`.

### Value Audit

| Value/Aspect | Classification | Notes | Action for Phase 3 |
|---|---|---|---|
| **Case count** | B — Derived | Generated from site mock data; not the confirmed 583 | Replace with real provider |
| **Case Number format** | C — Synthetic | 8-digit numeric starting with 19xxxxxx; format matches confirmed pattern | Replace with real provider |
| **Case Status derivation** | D — Assumed business logic | `sub === 'a' → 'New'; else → 'Case - In Progress'`. This assumes subcategory directly determines case status. In reality, it's likely the reverse. | Replace with real case status |
| **Severity composite string** | B — Derived | `${site.severity}(${sub})` — format confirmed, values from site mock | Replace with real provider |
| **Case Category values** | D — Assumed business logic | Only `Microinverter` confirmed. `Envoy`, `Meter`, `Other` are fabricated | Confirm full list from SFDC |
| **Case Type values** | D — Assumed business logic | Only `MI. Drop Out`, `MI. AC Branch Issue` confirmed. `MI. Low Power`, `Envoy. Not Reporting`, `Meter. Issue` are fabricated | Confirm full list from SFDC |
| **Site attributes on cases** | B — Derived | Copied from site mock: siteName, siteStatus, lastIntervalEndDate, etc. | Replace with real join |
| **1–2 cases per site** | C — Synthetic | Random choice; confirmed relationship is 583 cases for 526 sites (avg ~1.11) | Replace with real provider |
| **siteLink = siteId** | A — Confirmed reference | Screenshots confirm Site Link matches Site Id | Keep pattern |

### Causality Issue

The mock data derives case status FROM subcategory (`sub → caseStatus`). In the real system, the relationship is likely reversed: case status determines subcategory (`caseStatus → subcategory`). This inverted causality is acceptable for mock display but must not be carried into the production provider.

---

## 3. Mock Historical Severity (`mock-data/historical-severity.ts`)

### Generation Strategy

Historical data is generated for 20 installers across all dates from 2025-05-27 to 2026-09-01, skipping Sundays. Values are random integers from a seeded generator (`seed=123`).

### Value Audit

| Value/Aspect | Classification | Notes | Action for Phase 3 |
|---|---|---|---|
| **Installer list** | C — Synthetic | Same 20 names as site mock data | Replace with real provider |
| **Date range: 2025-05-27 to 2026-09-01** | A — Confirmed reference | Start date confirmed from screenshots; end date is approximate | Replace with real provider |
| **Sunday skip** | C — Synthetic | Mock skips Sundays; screenshots show some date gaps but pattern unknown | Replace with real provider |
| **Sev-1, Sev-2, Sev-3 values** | C — Synthetic | Random integers (0–7, 0–4, 0–9 respectively) | Replace with real provider |
| **Total = sev1 + sev2 + sev3** | A — Confirmed reference | Calculation rule confirmed from screenshots | Keep as calculated value |
| **No Sev-4 column** | A — Confirmed reference | Historical data excludes Sev-4, matching screenshots | Keep exclusion |
| **~8,400 total rows** | C — Synthetic | 20 installers × ~420 dates; reference says 497 rows (fewer installers/dates in production?) | Replace with real provider |

---

## 4. MockDataProvider (`src/services/MockDataProvider.ts`)

### Method Audit

| Method | Logic | Classification | Notes | Action for Phase 3 |
|---|---|---|---|---|
| `getSites(filters)` | Array filter using `includes()` for each filter field | B — Derived / correct pattern | IN-style filtering matches confirmed behavior | Keep pattern in real provider |
| `getSiteById(siteId)` | Array `find()` | B — Derived / correct pattern | Standard lookup | Keep pattern |
| `getCases(filters)` | Array filter on searchTerm, connectionType, miProductSku | B — Derived / correct pattern | Only 3 of the possible filters applied to cases | Review: should siteStage filter cases? |
| `getCasesBySiteId(siteId)` | Array `filter()` on siteId | B — Derived / correct pattern | Standard join | Keep pattern |
| `getCaseByNumber(caseNumber)` | Array `find()` | B — Derived / correct pattern | Standard lookup | Keep pattern |
| `getSeverityDistribution(filters)` | Groups filtered sites by severity level, counts subcategories | B — Derived / correct pattern | Percentage denominator = total filtered sites (correct) | Keep calculation logic |
| `getHistoricalSeverity()` | Returns all historical records (ignores filters) | D — Assumed business logic | Historical data does not respond to site filters. Should it? | Confirm filter behavior |
| `getKpis(filters)` | Calculates all 13 KPIs from filtered sites | B — Derived / correct pattern | Matches confirmed KPI formulas | Keep calculation logic |
| `getFilterOptions(field)` | Returns distinct values via `Set` | B — Derived / correct pattern | Standard distinct-values query | Keep pattern |

### KPI Calculation Audit

| KPI | MockDataProvider Code | Confirmed Formula | Match |
|---|---|---|---|
| totalSites | `sites.length` | Count of all C&I sites matching filters | ✓ |
| pctSev123 | `Math.round((sev123 / total) * 1000) / 10` + `%` | (Sev1+2+3) / Total × 100, round to 1 decimal | ✓ |
| countSev123 | `sev1.length + sev2.length + sev3.length` | Sum of Sev 1, 2, 3 counts | ✓ |
| sev123a | `[...sev1,...sev2,...sev3].filter(s => s.severitySubcategory === 'a').length` | Sev 1/2/3 sites with subcategory (a) | ✓ |
| sev123b | Same pattern for 'b' | Sev 1/2/3 sites with subcategory (b) | ✓ |
| sev123c | Same pattern for 'c' | Sev 1/2/3 sites with subcategory (c) | ✓ |
| pctSev4 | `Math.round((sev4.length / total) * 1000) / 10` + `%` | Sev4 / Total × 100 | ✓ |
| countSev4 | `sev4.length` | Count of Sev 4 sites | ✓ |
| pctSev1/2/3 | Same percentage pattern per level | Per-level % of total | ✓ |
| sitesWithOpenCases | `sites.filter(s => s.hasOpenCase).length` | Sites with ≥1 open case | ✓ |
| sitesWithNoOpenCases | `total - openCaseSites` | Total minus open-case sites | ⚠️ See note |

**Note on `sitesWithNoOpenCases`:** The current calculation is `total - openCaseSites`, which includes ALL non-open-case sites (including no-severity sites). The confirmed reference value of 16 is specifically "severity sites without open cases", NOT "all sites without open cases". This is a discrepancy:

- Current mock result: `2060 - openCaseSites` = a large number
- Confirmed reference: 16 (only severity sites with no open case, i.e., subcategory (c) sites)

**This is a known gap.** The label says "Sites without Open Cases" but the reference value of 16 means "Sev 1/2/3 (c) sites" — sites that HAVE severity but NO open case. The KPI may need to be renamed or recalculated.

---

## 5. Summary: What Should Happen in Phase 3

| Mock Component | Disposition |
|---|---|
| `mock-data/sites.ts` | Remain as dev/test fallback; replace with real provider for production |
| `mock-data/cases.ts` | Remain as dev/test fallback; replace with real provider for production |
| `mock-data/historical-severity.ts` | Remain as dev/test fallback; replace with real provider for production |
| `MockDataProvider` class | Remain as dev/test fallback; create `APIDataProvider` for production |
| `DataProvider` interface | Keep — this is the abstraction layer |
| KPI calculation logic | Keep formulas — they match confirmed business rules |
| Severity distribution logic | Keep — matches confirmed structure |
| Filter logic (IN-style arrays) | Keep — matches confirmed behavior |
| Sev 4 subcategory mock split | Document as assumed; do NOT carry into production without confirmation |
| Case Category/Type mock values | Confirm full lists from SFDC before production |
| `sitesWithNoOpenCases` calculation | Review — current formula may not match intended business meaning |
