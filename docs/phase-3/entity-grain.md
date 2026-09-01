# Entity Grain — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access for confirmation**

---

## Expected Entity Relationships (from Phase 2B)

### Site Grain

| Attribute | Expected Grain | Confidence |
|---|---|---|
| Site Id | One row per site | INFERRED from screenshots |
| Site Name | One per site | INFERRED |
| Site Status | One current value per site | INFERRED |
| Severity Level | One current value per site (1, 2, 3, 4, or null) | INFERRED |
| Severity Subcategory | One current value per site (a, b, c, or null) | INFERRED |
| Installer | One per site | INFERRED |
| Connection Type | One per site | INFERRED |
| Site Stage | One per site | INFERRED |

### Case Grain

| Attribute | Expected Grain | Confidence |
|---|---|---|
| Case Number | One row per case (unique PK) | INFERRED |
| Site Id | FK — many cases per site possible | CONFIRMED (583 cases / 526 sites) |
| Case Status | One per case | INFERRED |
| Severity | Composite string from site severity | INFERRED |
| Case Category | One per case | INFERRED |
| Case Type | One per case | INFERRED |

### Historical Grain

| Attribute | Expected Grain | Confidence |
|---|---|---|
| Date + Installer | One row per installer per date (composite key) | CONFIRMED from pivot table structure |
| Sev-1, Sev-2, Sev-3, Total | Measures per row | CONFIRMED |

## Relationship Summary

```
SITE (1) ──── (N) CASE
  │
  └── severity (current, one level per site)
  └── installer (one per site)
  └── status (current, one per site)

INSTALLER (1) ──── (N) SITE
  │
  └── historical (one row per installer per date)
```

### Multiplicity Evidence

| Relationship | Evidence | Confirmed |
|---|---|---|
| One site → many cases | 583 cases for 526 sites (avg 1.11) | CONFIRMED |
| One case → one site | Case Tracker shows siteId per case | INFERRED |
| One site → one installer | Each site row shows one installer | INFERRED |
| One installer → many sites | Multiple sites per installer in historical | CONFIRMED |

### Unresolved Questions

| # | Question | Status |
|---|---|---|
| 1 | Can a site have multiple severity records (historical severity per site)? | UNKNOWN |
| 2 | Can a site have multiple status records simultaneously? | UNKNOWN |
| 3 | Can a case belong to multiple sites? | UNKNOWN |
| 4 | Is the site-case relationship via a join or denormalized? | UNKNOWN |
| 5 | Is there an installer table or just installer name strings? | UNKNOWN |

## Discovery Plan

1. Query the site table insight and count distinct site IDs vs total rows
2. Query the case tracker insight and count distinct case numbers vs total rows
3. Check for duplicate site IDs in the case tracker (confirms 1:N)
4. Examine Business View joins to confirm relationship structure
