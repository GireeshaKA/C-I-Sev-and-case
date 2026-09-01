# Historical Data Contract — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access for confirmation**

---

## What We Know (from Phase 1 Screenshots)

| Attribute | Value | Confidence |
|---|---|---|
| Table title | "Historical Data per Installer" | CONFIRMED |
| Row count | 497 | CONFIRMED (screenshot reference only) |
| Row dimension | Installer name | CONFIRMED |
| Column dimensions | Date-grouped columns | CONFIRMED |
| Measures per date | Sev-1 Sites, Sev-2 Sites, Sev-3 Sites, Total | CONFIRMED |
| Sev-4 present | No | CONFIRMED (absent from columns) |
| Earliest date visible | 2025-05-27 | CONFIRMED |
| Latest date visible | ~2026-08-31 | INFERRED from screenshot context |
| Date gaps | Some dates missing (e.g., 2026-08-30) | CONFIRMED |
| Format | Pivot table | CONFIRMED |
| Total calculation | Total = Sev-1 + Sev-2 + Sev-3 | CONFIRMED |

## What We Do NOT Know

| # | Question | Status |
|---|---|---|
| 1 | Source Business View | UNKNOWN |
| 2 | Source schema/table | UNKNOWN |
| 3 | Date column name/type | UNKNOWN |
| 4 | Installer column name/reference | UNKNOWN |
| 5 | How Sev-1/2/3 counts are calculated | UNKNOWN — source columns or aggregated? |
| 6 | Whether Total is calculated or stored | UNKNOWN |
| 7 | Whether Sev-4 is excluded by design or filter | UNKNOWN |
| 8 | Snapshot vs event semantics | UNKNOWN |
| 9 | Timezone of date values | UNKNOWN |
| 10 | Why some dates are missing | UNKNOWN — weekends? data gaps? |
| 11 | Whether this is a separate table or derived from site data | UNKNOWN |
| 12 | Actual production row count | UNKNOWN (497 is screenshot reference) |

## Discovery Plan

### Step 1: Get the insight GUID
- Expand the historical pivot table in the dashboard
- Note the insightGuid from the URL

### Step 2: Query the insight
```
POST https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/dashboards/{dashboardGuid}/insights/{insightGuid}/query
Authorization: Bearer {PAT}
Content-Type: application/json

{
  "pagination": { "startRow": 0, "pageSize": 10 }
}
```

### Step 3: Examine response headers
The response will reveal:
- `dimensions[].field` → source column references for installer and date
- `measures[].field` → source column references for sev1, sev2, sev3, total
- `totalRows` → actual production row count

### Step 4: Examine the Business View
- Use List Schema Objects to find the source table
- Check if sev1/2/3 are stored columns or calculated aggregations
- Check if Total is a stored column or sum expression

## Mock vs Production Comparison

| Aspect | Mock | Production (expected) |
|---|---|---|
| Row count | ~8,400 | UNKNOWN (497 in screenshot) |
| Installer count | 20 | UNKNOWN |
| Date range | 2025-05-27 to 2026-09-01 | 2025-05-27 to present |
| Values | Random (seeded) | Real daily counts |
| Sunday gaps | Skipped by generator | UNKNOWN pattern |
| Sev-4 column | Absent (correct) | Absent (confirmed) |
