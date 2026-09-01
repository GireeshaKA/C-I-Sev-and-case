# Mock vs Incorta Differences — Phase 3 Discovery

> Status: **Most comparisons UNKNOWN — requires authenticated Incorta access**

---

## Comparison Matrix

| # | Aspect | Mock Implementation | Incorta (Expected) | Status |
|---|---|---|---|---|
| 1 | Total site count | 2,060 (hard-coded distribution) | 2,060 (KPI confirmed) — but changes over time | MATCH (snapshot) |
| 2 | Sev 1 count | 139 (hard-coded) | 139 (KPI confirmed) — but changes over time | MATCH (snapshot) |
| 3 | Sev 2 count | 67 (hard-coded) | 67 (KPI confirmed) — but changes over time | MATCH (snapshot) |
| 4 | Sev 3 count | 128 (hard-coded) | 128 (KPI confirmed) — but changes over time | MATCH (snapshot) |
| 5 | Sev 4 count | 123 (hard-coded) | 123 (KPI confirmed) — but changes over time | MATCH (snapshot) |
| 6 | Sev 1/2/3 (a) count | 31 (hard-coded) | 31 (KPI confirmed) | MATCH (snapshot) |
| 7 | Sev 1/2/3 (b) count | 287 (hard-coded) | 287 (KPI confirmed) | MATCH (snapshot) |
| 8 | Sev 1/2/3 (c) count | 16 (hard-coded) | 16 (KPI confirmed) | MATCH (snapshot) |
| 9 | Sev 4 subcategories | (b)=100, (c)=23 — **FABRICATED** | UNKNOWN | MOCK ASSUMPTION |
| 10 | Severity assignment rules | Not implemented — hard-coded | UNKNOWN — calculated column or source? | UNKNOWN |
| 11 | Subcategory derivation | Inverted: sub → caseStatus | UNKNOWN — likely caseStatus → sub | UNKNOWN |
| 12 | No Severity count | 1,603 (arithmetic remainder) | UNKNOWN — may be null/blank severity | UNKNOWN |
| 13 | No Severity handling | `severity === null` in mock | UNKNOWN — how does Incorta represent it? | UNKNOWN |
| 14 | Case statuses | `New`, `Case - In Progress` only | UNKNOWN — possibly more statuses | UNKNOWN |
| 15 | Open case definition | `hasOpenCase = sub === 'a' \|\| sub === 'b'` | UNKNOWN — real filter expression | UNKNOWN |
| 16 | Case Category values | Microinverter, Envoy, Meter, Other | UNKNOWN — only Microinverter confirmed | MOCK ASSUMPTION |
| 17 | Case Type values | 5 fabricated types | UNKNOWN — only 2 confirmed | MOCK ASSUMPTION |
| 18 | Site Status distribution | Random assignment | UNKNOWN — real distribution | MOCK ASSUMPTION |
| 19 | Percentage calculation | `Math.round(n/total*1000)/10` | UNKNOWN — may differ slightly in rounding | UNKNOWN |
| 20 | `sitesWithNoOpenCases` | `total - openCaseSites` | 16 (screenshot) — likely severity sites with sub (c) | MISMATCH |
| 21 | Historical row count | ~8,400 (20 installers × 420 days) | 497 (screenshot reference) | MISMATCH |
| 22 | Historical installer count | 20 | UNKNOWN | UNKNOWN |
| 23 | Historical date gaps | Sundays skipped | UNKNOWN — actual gap pattern | UNKNOWN |
| 24 | Site names | Synthetic | Real production site names | MOCK ASSUMPTION |
| 25 | Site IDs | Synthetic (random numeric) | Real numeric IDs | MOCK ASSUMPTION |
| 26 | Case numbers | Synthetic (random 8-digit) | Real case numbers | MOCK ASSUMPTION |
| 27 | Filter behavior | Array-based IN filtering | UNKNOWN — prompt-based filtering via API | UNKNOWN |
| 28 | Data freshness | Static (generated once at import) | Live/refreshed periodically | MISMATCH |
| 29 | Composite severity | `${level}(${sub})` concatenation | UNKNOWN — source column or calculated? | UNKNOWN |
| 30 | `siteLink` | Equals `siteId` | Appears to equal siteId in screenshots | MATCH |

## Classification Summary

| Classification | Count | Examples |
|---|---|---|
| **MATCH** | 9 | KPI counts, (a)/(b)/(c) totals, siteLink format |
| **MISMATCH** | 3 | sitesWithNoOpenCases, historical row count, data freshness |
| **MOCK ASSUMPTION** | 6 | Sev4 subcategories, case categories/types, site status distribution, site names/IDs |
| **UNKNOWN** | 12 | Severity rules, subcategory derivation, open case definition, filter behavior |

## Key Discrepancies Requiring Resolution

### 1. `sitesWithNoOpenCases` (MISMATCH)
- **Mock:** `total - openCaseSites` = a large number including no-severity sites
- **Reference:** 16 — this appears to mean "severity sites with subcategory (c)" specifically
- **Impact:** KPI label and calculation need reconciliation

### 2. Historical Row Count (MISMATCH)
- **Mock:** ~8,400 rows
- **Reference:** 497 rows in screenshot
- **Impact:** Either fewer installers or fewer date entries in production

### 3. Sev 4 Subcategories (MOCK ASSUMPTION)
- **Mock:** (b)=100, (c)=23 — completely fabricated
- **Reference:** Only two partially visible values in screenshots
- **Impact:** Must not be carried into production
