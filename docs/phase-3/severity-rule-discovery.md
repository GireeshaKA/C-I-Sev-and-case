# Severity Rule Discovery — Phase 3

> Status: **BLOCKED — requires authenticated access to inspect insight expressions and Business View definitions**

---

## P0 Blocker: How is Severity (1–4) Assigned to a Site?

This is the #1 unresolved business question from Phase 2B.

### What We Know (from screenshots only)

- Severity levels are 1, 2, 3, 4 (no S0, no "S" prefix)
- Severity appears as a site-level attribute (not case-level)
- The composite format `{level}({subcategory})` is displayed in the Case Tracker
- Severity is used as a filter/grouping dimension across the dashboard

### What We Do NOT Know

- Whether severity is a **source column** (stored in a table from an upstream system)
- Whether severity is a **calculated column** (derived from site metrics via a CASE expression or formula)
- Whether severity is an **insight-level expression** (calculated at query time)
- The exact rules for each level (1, 2, 3, 4)
- Whether severity can change over time (dynamic vs. static)
- Whether severity is assigned by automation or manually

### Discovery Plan

When authenticated access is available, inspect the following:

#### Step 1: Find the severity column reference
- Query the main site table insight via the Insight Query API
- The response `headers.dimensions` or `headers.measures` will include the severity column
- The `field` property will reveal: `{schemaName}.{tableName}.{columnName}`

#### Step 2: Determine if it's a calculated column
- Use the List Schema Objects API to inspect the table/view
- If the column is a calculated column, its expression will contain the severity assignment logic
- Look for CASE statements, IF/THEN, or formula references

#### Step 3: Check for upstream source
- If severity is a plain column (not calculated), it comes from an upstream data source
- This means severity assignment happens outside Incorta (e.g., in SFDC, a data pipeline, or another system)

## Severity Level Template (to be completed with findings)

```
Severity 1:
  Source: UNKNOWN
  Expression: UNKNOWN
  Evidence: UNKNOWN
  Confidence: UNKNOWN

Severity 2:
  Source: UNKNOWN
  Expression: UNKNOWN
  Evidence: UNKNOWN
  Confidence: UNKNOWN

Severity 3:
  Source: UNKNOWN
  Expression: UNKNOWN
  Evidence: UNKNOWN
  Confidence: UNKNOWN

Severity 4:
  Source: UNKNOWN
  Expression: UNKNOWN
  Evidence: UNKNOWN
  Confidence: UNKNOWN
```

## Severity Nature

| Question | Answer | Confidence |
|---|---|---|
| Is severity site-level? | Yes | INFERRED (from screenshots) |
| Is severity case-level? | No — cases show site severity, not independent case severity | INFERRED |
| Is severity calculated dynamically? | UNKNOWN | BLOCKED |
| Is severity sourced from another system? | UNKNOWN | BLOCKED |
| Can severity change over time? | UNKNOWN (historical data tracks severity counts over time, implying changes) | INFERRED |

## (a)/(b)/(c) Subcategory Rules

### What We Know (from screenshots)

- (a) = Open case, not in progress
- (b) = Open case, in progress
- (c) = No open cases

### What We Do NOT Know

- The exact implementation (calculated column, insight expression, or source field)
- Whether (a)/(b)/(c) is a single column or derived at query time
- The aggregation rule when a site has multiple cases with different statuses
- Whether Sev 4 follows the same (a)/(b)/(c) model

### Discovery Steps

1. Query the severity breakdown insight and examine column metadata
2. Look for a column named like "subcategory" or "case_status_group" in the Business View
3. If it's a calculated column, the expression will reveal the exact logic
4. Compare with the Case Tracker's composite severity column

## What Is Needed

- **Authenticated browser access** to expand the severity-related insights and inspect their configuration
- **OR** a PAT to query insights and examine response headers (which reveal `field` references)
- **OR** access to the Business View definitions in the Incorta Content Manager
