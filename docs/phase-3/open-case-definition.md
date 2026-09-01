# Open Case Definition — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access**
> P0 Blocker #2 from Phase 2B

---

## Question

What exactly does Incorta consider an "OPEN CASE"?

## What We Know (from screenshots only)

| Attribute | Value | Source |
|---|---|---|
| Visible case statuses | `New`, `Case - In Progress` | Screenshot 3 (Case Tracker) |
| Sites with open cases | 526 | Screenshot 2 |
| Case Tracker rows | 583 | Screenshot 3 |
| Tab title | "SFDC OPEN Cases Only" | Screenshot 2 |

## What We Do NOT Know

| # | Question | Status |
|---|---|---|
| 1 | Complete list of SFDC case statuses | UNKNOWN |
| 2 | Which statuses qualify as "open" | UNKNOWN — only `New` and `Case - In Progress` are visible |
| 3 | Are there statuses like `Closed`, `Resolved`, `Escalated`, `Pending`, `On Hold`? | UNKNOWN |
| 4 | Is the "open" filter a dashboard prompt, insight filter, or Business View filter? | UNKNOWN |
| 5 | Is "open" defined by a calculated column or a WHERE clause? | UNKNOWN |
| 6 | Does the Case Tracker only show open cases, or all cases? | INFERRED — appears to show only open cases (title says "Case Tracker" but only open statuses visible) |

## Discovery Plan

### Step 1: Examine the "SFDC OPEN Cases Only" insight
- Get the insight GUID
- Query it via the Insight Query API
- Examine the response headers for the case status column reference
- Look at the filters in the insight definition

### Step 2: Check for dashboard-level case status filter
- The Dashboard Prompts API may reveal a case status prompt
- If present, the `values` array would show all possible statuses

### Step 3: Examine the Business View definition
- Find the Business View used by the open cases insight
- Look for WHERE clauses or calculated columns that filter to "open" cases
- Check if there's a column like `is_open` or a filter expression

### Step 4: Query the case status column
- Use the Business View Query API to get distinct values of the case status column
- This would reveal the complete list of statuses in the source data

## Open Case Definition Template (to be completed)

```
Open case definition: UNKNOWN
Included statuses: UNKNOWN (only New, Case - In Progress observed)
Excluded statuses: UNKNOWN
Source: UNKNOWN
Expression/filter: UNKNOWN
Evidence: Screenshots only
Confidence: LOW — only 2 statuses observed, complete list unknown
```

## Impact

The open case definition directly affects:
- The (a)/(b)/(c) subcategory calculation
- The "Sites with Open Cases" KPI (526)
- The "Sites without Open Cases" KPI (16)
- The Open Cases page content
- The Case Tracker content
