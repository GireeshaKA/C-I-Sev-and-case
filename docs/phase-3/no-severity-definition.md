# No Severity Definition — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access**
> P0 Blocker #3 from Phase 2B

---

## Question

What does "No Severity" actually mean in the Incorta dashboard?

## What We Know (from Phase 2B reconciliation)

| Metric | Value | Source |
|---|---|---|
| Total C&I Sites | 2,060 | CONFIRMED (Screenshot 1 KPI) |
| Sev 1 sites | 139 | CONFIRMED |
| Sev 2 sites | 67 | CONFIRMED |
| Sev 3 sites | 128 | CONFIRMED |
| Sev 4 sites | 123 | CONFIRMED |
| Total severity sites | 457 | CONFIRMED (139+67+128+123) |
| **Implied "No Severity"** | **1,603** | **INFERRED** (2,060 − 457) |

**The 1,603 value is NOT authoritative.** It is the arithmetic remainder. It has NOT been confirmed from Incorta.

## What We Do NOT Know

| # | Question | Status |
|---|---|---|
| 1 | Is "No Severity" a real Incorta category? | UNKNOWN |
| 2 | Is it simply the remainder of Total C&I Sites minus severity sites? | UNKNOWN |
| 3 | Are these sites intentionally excluded from severity distribution? | UNKNOWN |
| 4 | Is there a separate severity value (e.g., `null`, `0`, `None`, blank)? | UNKNOWN |
| 5 | Is severity only assigned under certain conditions (e.g., certain SKUs, site stages)? | UNKNOWN |
| 6 | Does Incorta have a filter that shows/hides no-severity sites? | UNKNOWN |
| 7 | Are no-severity sites a different population (e.g., residential, inactive)? | UNKNOWN |
| 8 | Is the Total C&I Sites count inclusive or exclusive of no-severity sites? | INFERRED inclusive (percentage arithmetic confirms 2,060 denominator) |

## Possible Explanations

### A: Severity is conditional
Severity (1–4) is only calculated for sites meeting certain criteria (e.g., specific SKUs, site stages, issue conditions). Sites not meeting these criteria have `null` severity.

### B: Severity is issue-based
Only sites with active issues get a severity level. "Normal" sites have no severity because there's nothing to rate.

### C: Severity is from an external system
Severity comes from SFDC or another system and only exists for sites that have been assessed/flagged.

### D: Severity is a filter scope
The dashboard shows "Total C&I Sites" as the universe but severity is only calculated for a subset. The severity-focused views (breakdown, site table) may filter to severity-only sites.

## Discovery Plan

### Step 1: Examine the Total C&I Sites KPI insight
- Determine if it counts ALL sites or filtered sites
- Check for filters or prompts that scope the count

### Step 2: Examine the severity column in the site Business View
- Look at the column definition (type, nullable, calculated?)
- Query distinct values to see if `null`, `0`, `None`, or blank appears

### Step 3: Query the site table insight without severity filter
- Compare total rows to the KPI count
- Check for null/blank severity values in the response

### Step 4: Check if severity assignment has preconditions
- Look for calculated column expressions that conditionally assign severity
- Look for CASE expressions with conditions based on site metrics

## No Severity Definition Template (to be completed)

```
"No Severity" meaning: UNKNOWN
Is it a real Incorta category: UNKNOWN
Is it the arithmetic remainder: INFERRED YES
Is there a null/blank severity value: UNKNOWN
Is severity conditional: UNKNOWN
Are no-severity sites excluded from any views: UNKNOWN
Evidence: Phase 2B arithmetic reconciliation only
Confidence: LOW — only inferred from KPI arithmetic
```
